import { useState } from "react";
import { Heart, MessageCircle, Pin, Send, Trash2 } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  addComment,
  deletePost,
  fetchComments,
  toggleLike,
  PULSE_CHANNELS,
  type PulseComment,
  type PulsePost,
} from "@/services/pulseFeedService";

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

function MediaGrid({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <div
      className={cn(
        "grid gap-1 overflow-hidden rounded-xl",
        urls.length === 1 ? "grid-cols-1" : "grid-cols-2",
      )}
    >
      {urls.slice(0, 4).map((url, i) =>
        isVideoUrl(url) ? (
          <video key={i} src={url} controls className="max-h-80 w-full bg-black object-cover" />
        ) : (
          <img key={i} src={url} alt="" loading="lazy" className="max-h-80 w-full object-cover" />
        ),
      )}
    </div>
  );
}

function CommentThread({ postId }: { postId: string }) {
  const { status } = useAuth();
  const [comments, setComments] = useState<PulseComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => void fetchComments(postId).then(setComments);
  if (comments === null) load();

  const submit = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await addComment(postId, draft.trim());
      setDraft("");
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-white/[0.06] px-4 py-3">
      {comments?.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-mist-300">
            {(c.authorName || "?")[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <span className="font-medium text-mist-200">{c.authorName}</span>{" "}
            <span className="text-mist-300">{c.body}</span>
            <p className="text-[11px] text-mist-500">{timeAgo(c.createdAt)}</p>
          </div>
        </div>
      ))}
      {status === "signedIn" && (
        <div className="flex items-center gap-2 pt-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Write a reply…"
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-mist-100 placeholder:text-mist-500 focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={busy || !draft.trim()}
            className="shrink-0 rounded-full bg-tide-500/20 p-1.5 text-tide-300 disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export function PulsePostCard({
  post,
  onChanged,
  canModerate,
}: {
  post: PulsePost;
  onChanged: () => void;
  canModerate: boolean;
}) {
  const { status, user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const channelLabel = PULSE_CHANNELS.find((c) => c.id === post.channel)?.label ?? post.channel;

  const like = async () => {
    if (status !== "signedIn") return;
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => n + (next ? 1 : -1));
    try {
      await toggleLike(post.id, !next);
    } catch {
      setLiked(!next);
      setLikeCount((n) => n + (next ? -1 : 1));
    }
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    await deletePost(post.id);
    onChanged();
  };

  const isOwn = user?.id === post.authorId;

  return (
    <article className="glass overflow-hidden rounded-2xl">
      <div className="flex items-start gap-3 p-4 pb-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-tide-500/15 text-sm font-semibold text-tide-300">
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            (post.authorName || "?")[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-mist-100">{post.authorName}</span>
            <span className="text-xs text-mist-500">{timeAgo(post.createdAt)}</span>
            {post.isPinned && <Pin size={11} className="text-sand-300" />}
          </div>
          <p className="text-xs text-mist-400">
            {channelLabel}
            {post.location && <span> · {post.location}</span>}
          </p>
        </div>
        {(isOwn || canModerate) && (
          <button
            onClick={remove}
            aria-label="Delete post"
            className="shrink-0 rounded-full p-1.5 text-mist-500 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed text-mist-200">{post.body}</p>

      {post.mediaUrls.length > 0 && <div className="px-4 pb-3">{<MediaGrid urls={post.mediaUrls} />}</div>}

      <div className="flex items-center gap-4 border-t border-white/[0.06] px-4 py-2.5 text-sm">
        <button
          onClick={like}
          disabled={status !== "signedIn"}
          className={cn(
            "flex items-center gap-1.5 disabled:opacity-50",
            liked ? "text-rose-300" : "text-mist-400 hover:text-mist-200",
          )}
        >
          <Heart size={15} className={liked ? "fill-current" : undefined} />
          {likeCount > 0 && likeCount}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-mist-400 hover:text-mist-200"
        >
          <MessageCircle size={15} />
          {showComments ? "Hide" : "Comment"}
        </button>
      </div>

      {showComments && <CommentThread postId={post.id} />}
    </article>
  );
}
