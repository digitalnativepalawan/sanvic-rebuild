import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Cloud, HardDrive, KeyRound, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { PlacesAdmin } from "./PlacesAdmin";
import { RecommendationsAdmin } from "./RecommendationsAdmin";
import { UpdatesAdmin } from "./UpdatesAdmin";
import { BarangaysAdmin } from "./BarangaysAdmin";

// /admin — content management for places, Today recommendations, Pulse
// updates, and barangays.
//
// Access: a simple passkey gate (VITE_ADMIN_PASSKEY, dev fallback "5309").
// This is prototype-grade protection for a content demo, NOT security: the
// passkey ships in the client bundle. Before production, move admin behind
// Supabase Auth (role check via RLS) or an Edge Function. See README.

const UNLOCK_KEY = "sanvic.admin_unlocked";

const isDev = import.meta.env.DEV;
const configuredPasskey = import.meta.env.VITE_ADMIN_PASSKEY;
const effectiveAdminPasskey = configuredPasskey || (isDev ? "5309" : "");

function PasskeyGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const expected = effectiveAdminPasskey;

  if (!expected) {
    return (
      <div className="glass mx-auto mt-16 max-w-md space-y-3 rounded-2xl p-6 text-center">
        <ShieldAlert size={28} className="mx-auto text-sand-300" />
        <h1 className="font-display text-xl font-semibold text-mist-100">Admin is locked</h1>
        <p className="text-sm text-mist-400">
          This is a production build and no <code className="text-mist-200">VITE_ADMIN_PASSKEY</code>{" "}
          is configured. Add that environment variable where this app is deployed (e.g. Vercel →
          Project → Settings → Environment Variables) and redeploy to enable admin. Local dev
          (<code className="text-mist-200">npm run dev</code>) falls back to passkey{" "}
          <code className="text-mist-200">5309</code>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value === expected) {
          try {
            sessionStorage.setItem(UNLOCK_KEY, "1");
          } catch {
            // session-only unlock still works via state
          }
          onUnlock();
        } else {
          setError(true);
        }
      }}
      className="glass mx-auto mt-16 max-w-md space-y-4 rounded-2xl p-6"
    >
      <div className="text-center">
        <KeyRound size={28} className="mx-auto text-tide-300" />
        <h1 className="mt-2 font-display text-xl font-semibold text-mist-100">SANVIC Admin</h1>
        <p className="mt-1 text-sm text-mist-400">Enter the admin passkey to manage content.</p>
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        autoFocus
        placeholder="Passkey"
        className={cn(
          "w-full rounded-lg border bg-ocean-900/80 px-3 py-2.5 text-center text-sm text-mist-100 tracking-[0.3em] placeholder:tracking-normal placeholder:text-mist-500 focus:outline-none",
          error ? "border-rose-400/50" : "border-white/10 focus:border-tide-400/50",
        )}
      />
      {error && <p className="text-center text-xs text-rose-300">That passkey isn't right.</p>}
      <button
        type="submit"
        className="w-full rounded-lg bg-tide-500/20 py-2.5 text-sm font-medium text-tide-300 hover:bg-tide-500/30"
      >
        Unlock
      </button>
    </form>
  );
}

const TABS = [
  { id: "places", label: "Places", el: <PlacesAdmin /> },
  { id: "recommendations", label: "Today", el: <RecommendationsAdmin /> },
  { id: "updates", label: "Pulse", el: <UpdatesAdmin /> },
  { id: "barangays", label: "Barangays", el: <BarangaysAdmin /> },
] as const;

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("places");

  if (!unlocked) return <PasskeyGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-center gap-3 pt-2 md:pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-mist-100">Admin</h1>
          <p className="text-sm text-mist-400">
            Places, Today recommendations, Pulse updates, and barangays.
          </p>
        </div>
        <Link to="/" className="chip border border-white/10 bg-white/5 text-mist-300">
          <ArrowLeft size={13} />
          Back to app
        </Link>
      </header>

      <p
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs",
          isSupabaseConfigured
            ? "border-tide-400/25 bg-tide-500/[0.07] text-tide-300"
            : "border-white/10 bg-white/[0.04] text-mist-400",
        )}
      >
        {isSupabaseConfigured ? <Cloud size={14} /> : <HardDrive size={14} />}
        {isSupabaseConfigured
          ? "Supabase connected — edits write to the database (and cache locally)."
          : "Local draft mode — no Supabase configured, so edits persist in this browser's storage and appear across the app immediately."}
      </p>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "chip shrink-0 border",
              tab === t.id
                ? "border-tide-400/40 bg-tide-500/15 text-tide-300"
                : "border-white/10 bg-white/5 text-mist-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {TABS.find((t) => t.id === tab)?.el}
    </div>
  );
}
