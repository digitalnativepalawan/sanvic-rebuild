import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

// Auth: Supabase email magic link. No passwords, no custom backend. When
// Supabase isn't configured (local-only mode), auth is simply unavailable —
// callers should treat that the same as "signed out" and the UI explains it.

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface AuthState {
  status: "loading" | "signedOut" | "signedIn";
  user?: User;
  profile?: Profile;
  isAdmin?: boolean;
}

let state: AuthState = { status: supabase ? "loading" : "signedOut" };
const listeners = new Set<() => void>();

function publish(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

export function getAuthState(): AuthState {
  return state;
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function fromProfileRow(row: {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}): Profile {
  return { id: row.id, displayName: row.display_name, avatarUrl: row.avatar_url, bio: row.bio };
}

async function loadProfile(userId: string): Promise<Profile | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? fromProfileRow(data) : undefined;
}

async function loadIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data !== null;
}

async function applySession(session: Session | null) {
  if (!session) {
    publish({ status: "signedOut" });
    return;
  }
  const [profile, isAdmin] = await Promise.all([
    loadProfile(session.user.id),
    loadIsAdmin(session.user.id),
  ]);
  publish({ status: "signedIn", user: session.user, profile, isAdmin });
}

if (supabase) {
  void supabase.auth.getSession().then(({ data }) => applySession(data.session));
  supabase.auth.onAuthStateChange((_event, session) => {
    void applySession(session);
  });
}

export const isAuthConfigured = supabase !== null;

/** Sends a magic-link sign-in email. Resolves once the email is sent (or throws). */
export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error("Supabase isn't configured for this build.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + "/trip" },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function updateProfile(patch: Partial<Pick<Profile, "displayName" | "bio" | "avatarUrl">>): Promise<void> {
  if (!supabase || state.status !== "signedIn" || !state.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: patch.displayName,
      bio: patch.bio,
      avatar_url: patch.avatarUrl,
    })
    .eq("id", state.user.id);
  if (error) throw error;
  const profile = await loadProfile(state.user.id);
  publish({ ...state, profile });
}
