import { supabase } from "@/lib/supabase";
import { getAuthState } from "@/services/authService";

// The Pulse community feed: real posts from real users, not mock data.
// Requires Supabase (isFeedAvailable === false otherwise) — this is
// genuinely multi-user content, unlike the rest of the app's local-first
// fallback pattern, because a post only means something if other people
// can see it.

export const PULSE_CHANNELS = [
  { id: "all", label: "All" },
  { id: "hidden-spots", label: "Hidden Spots" },
  { id: "island-hopping", label: "Island Hopping" },
  { id: "food-nightlife", label: "Food & Nightlife" },
  { id: "surf-report", label: "Surf Report" },
  { id: "events-tonight", label: "Events Tonight" },
] as const;

export type PulseChannel = (typeof PULSE_CHANNELS)[number]["id"];

export interface PulsePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  channel: PulseChannel;
  body: string;
  location?: string;
  mediaUrls: string[];
  isPinned: boolean;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface PulseComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  createdAt: string;
}

export const isFeedAvailable = supabase !== null;

interface AuthorRow {
  display_name: string | null;
  avatar_url: string | null;
}
interface PostRow {
  id: string;
  author_id: string;
  channel: string;
  body: string;
  location: string | null;
  media_urls: string[];
  is_pinned: boolean;
  created_at: string;
  author: AuthorRow | AuthorRow[] | null;
  pulse_likes: { count: number }[];
}

function authorOf(row: { author: AuthorRow | AuthorRow[] | null }): AuthorRow | null {
  return Array.isArray(row.author) ? (row.author[0] ?? null) : row.author;
}

const NETWORK_TIMEOUT_MS = 6000;
function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), NETWORK_TIMEOUT_MS)),
  ]);
}

export async function fetchPosts(channel: PulseChannel): Promise<PulsePost[]> {
  if (!supabase) return [];
  let query = supabase
    .from("pulse_posts")
    .select("*, author:profiles(display_name, avatar_url), pulse_likes(count)")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (channel !== "all") query = query.eq("channel", channel);

  let data: unknown[] | null, error: { message: string } | null;
  try {
    ({ data, error } = await withTimeout(query, "Fetching posts timed out"));
  } catch {
    return [];
  }
  if (error || !data) return [];

  const rows = data as unknown as PostRow[];
  const myId = getAuthState().user?.id;
  const likedSet = new Set<string>();
  if (myId && rows.length) {
    try {
      const { data: likes } = await withTimeout(
        supabase.from("pulse_likes").select("post_id").eq("user_id", myId).in(
          "post_id",
          rows.map((r) => r.id),
        ),
        "Fetching likes timed out",
      );
      for (const l of likes ?? []) likedSet.add(l.post_id);
    } catch {
      // Likes are a nice-to-have on top of the feed — skip on failure.
    }
  }

  return rows.map((row) => {
    const author = authorOf(row);
    return {
      id: row.id,
      authorId: row.author_id,
      authorName: author?.display_name || "SANVIC local",
      authorAvatarUrl: author?.avatar_url ?? undefined,
      channel: row.channel as PulseChannel,
      body: row.body,
      location: row.location ?? undefined,
      mediaUrls: row.media_urls ?? [],
      isPinned: row.is_pinned,
      createdAt: row.created_at,
      likeCount: row.pulse_likes?.[0]?.count ?? 0,
      likedByMe: likedSet.has(row.id),
    };
  });
}

export function subscribeToNewPosts(onInsert: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel("pulse_posts_live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "pulse_posts" }, onInsert)
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

/** Uploads media to Storage and returns their public URLs. */
export async function uploadPulseMedia(files: File[]): Promise<string[]> {
  if (!supabase) return [];
  const userId = getAuthState().user?.id;
  if (!userId) throw new Error("Sign in to attach photos or video.");
  const urls: string[] = [];
  for (const file of files) {
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("pulse-media").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("pulse-media").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function createPost(input: {
  channel: PulseChannel;
  body: string;
  location?: string;
  mediaUrls: string[];
}): Promise<void> {
  if (!supabase) throw new Error("Supabase isn't configured for this build.");
  const userId = getAuthState().user?.id;
  if (!userId) throw new Error("Sign in to post.");
  const { error } = await supabase.from("pulse_posts").insert({
    author_id: userId,
    channel: input.channel === "all" ? "all" : input.channel,
    body: input.body,
    location: input.location || null,
    media_urls: input.mediaUrls,
  });
  if (error) throw error;
}

export async function deletePost(postId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("pulse_posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function toggleLike(postId: string, currentlyLiked: boolean): Promise<void> {
  if (!supabase) return;
  const userId = getAuthState().user?.id;
  if (!userId) throw new Error("Sign in to like posts.");
  if (currentlyLiked) {
    await supabase.from("pulse_likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("pulse_likes").insert({ post_id: postId, user_id: userId });
  }
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: AuthorRow | AuthorRow[] | null;
}

export async function fetchComments(postId: string): Promise<PulseComment[]> {
  if (!supabase) return [];
  let data: unknown[] | null, error: { message: string } | null;
  try {
    ({ data, error } = await withTimeout(
      supabase
        .from("pulse_comments")
        .select("*, author:profiles(display_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }),
      "Fetching comments timed out",
    ));
  } catch {
    return [];
  }
  if (error || !data) return [];
  return (data as unknown as CommentRow[]).map((row) => {
    const author = authorOf(row);
    return {
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      authorName: author?.display_name || "SANVIC local",
      authorAvatarUrl: author?.avatar_url ?? undefined,
      body: row.body,
      createdAt: row.created_at,
    };
  });
}

export async function addComment(postId: string, body: string): Promise<void> {
  if (!supabase) throw new Error("Supabase isn't configured for this build.");
  const userId = getAuthState().user?.id;
  if (!userId) throw new Error("Sign in to comment.");
  const { error } = await supabase.from("pulse_comments").insert({
    post_id: postId,
    author_id: userId,
    body,
  });
  if (error) throw error;
}
