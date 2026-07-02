import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Mail, X } from "lucide-react";
import { isAuthConfigured, sendMagicLink } from "@/services/authService";

// Easy login: email in, magic link out — no password. Renders as a centered
// glass modal reachable from the profile screen or anywhere sign-in is
// needed (posting to Pulse). Portaled to document.body so it always
// covers the true viewport — any `.glass` (backdrop-filter) ancestor would
// otherwise create a CSS containing block that traps a `position: fixed`
// child inside that ancestor's small box instead of the screen.

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-ocean-950/70 p-4 backdrop-blur-sm">
      <div className="glass relative w-full max-w-sm rounded-3xl p-6">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-mist-400 hover:bg-white/5"
        >
          <X size={16} />
        </button>

        {!isAuthConfigured ? (
          <div className="space-y-2 pt-2 text-center">
            <Mail size={26} className="mx-auto text-sand-300" />
            <h2 className="font-display text-lg font-semibold text-mist-100">Sign-in isn't set up yet</h2>
            <p className="text-sm text-mist-400">
              This build isn't connected to Supabase, so login and Pulse posting aren't available.
            </p>
          </div>
        ) : sent ? (
          <div className="space-y-2 pt-2 text-center">
            <CheckCircle2 size={26} className="mx-auto text-tide-300" />
            <h2 className="font-display text-lg font-semibold text-mist-100">Check your email</h2>
            <p className="text-sm text-mist-400">
              We sent a sign-in link to <span className="text-mist-200">{email}</span>. Open it on
              this device to finish signing in.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-2">
            <div className="text-center">
              <Mail size={26} className="mx-auto text-tide-300" />
              <h2 className="mt-2 font-display text-lg font-semibold text-mist-100">Sign in</h2>
              <p className="mt-1 text-sm text-mist-400">
                No password — we'll email you a link.
              </p>
            </div>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-ocean-900/80 px-3 py-2.5 text-center text-sm text-mist-100 placeholder:text-mist-500 focus:border-tide-400/50 focus:outline-none"
            />
            {error && <p className="text-center text-xs text-rose-300">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-tide-500/20 py-2.5 text-sm font-medium text-tide-300 hover:bg-tide-500/30 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
