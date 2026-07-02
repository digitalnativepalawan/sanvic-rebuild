import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, MapPin, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  createPost,
  uploadPulseMedia,
  PULSE_CHANNELS,
  type PulseChannel,
} from "@/services/pulseFeedService";

const isVideo = (file: File) => file.type.startsWith("video/");

export function PulseComposer({
  channel,
  onPosted,
  onRequireLogin,
}: {
  /** The currently active channel filter — used as the default for new posts. */
  channel: PulseChannel;
  onPosted: () => void;
  onRequireLogin: () => void;
}) {
  const { status, profile } = useAuth();
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [postChannel, setPostChannel] = useState<PulseChannel>(channel === "all" ? "hidden-spots" : channel);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  if (status !== "signedIn") {
    return (
      <button
        onClick={onRequireLogin}
        className="glass glass-hover w-full rounded-2xl px-4 py-3.5 text-left text-sm text-mist-400"
      >
        Sign in to share something with San Vicente…
      </button>
    );
  }

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      const mediaUrls = files.length ? await uploadPulseMedia(files) : [];
      await createPost({ channel: postChannel, body: body.trim(), location: location.trim(), mediaUrls });
      setBody("");
      setLocation("");
      setFiles([]);
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tide-500/15 text-sm font-semibold text-tide-300">
          {(profile?.displayName || "?")[0]?.toUpperCase()}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Anyone heading to Port Barton? Share a boat, a spot, a tip…"
          rows={2}
          className="min-w-0 flex-1 resize-none bg-transparent text-sm text-mist-100 placeholder:text-mist-500 focus:outline-none"
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-12">
          {files.map((f, i) => (
            <span
              key={i}
              className="chip border border-white/10 bg-white/5 text-mist-300"
            >
              {f.name.length > 18 ? f.name.slice(0, 18) + "…" : f.name}
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="pl-12 text-xs text-rose-300">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 pl-12">
        <select
          value={postChannel}
          onChange={(e) => setPostChannel(e.target.value as PulseChannel)}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-mist-300 focus:outline-none"
        >
          {PULSE_CHANNELS.filter((c) => c.id !== "all").map((c) => (
            <option key={c.id} value={c.id} className="bg-ocean-900">
              {c.label}
            </option>
          ))}
        </select>
        <div className="flex min-w-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5">
          <MapPin size={12} className="shrink-0 text-mist-400" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-24 min-w-0 bg-transparent text-xs text-mist-300 placeholder:text-mist-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => fileInput.current?.click()}
          className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
        >
          <ImageIcon size={13} />
          Photo/video
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
        />
        <button
          onClick={submit}
          disabled={busy || !body.trim()}
          className={cn(
            "chip ml-auto border border-tide-400/30 bg-tide-500/15 text-tide-300",
            (busy || !body.trim()) && "opacity-50",
          )}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Post
        </button>
      </div>
    </div>
  );
}

export { isVideo };
