import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, X, Send, MapPin, Plus, Check } from "lucide-react";
import type { TalaMessage } from "@/types";
import { askTala, TALA_SUGGESTIONS } from "@/services/talaService";
import { getWeather } from "@/services/weatherService";
import { useTala } from "./TalaContext";
import { useIsSaved } from "@/hooks/useTrip";
import { toggleSaved } from "@/services/tripService";
import { categoryMeta } from "@/data/categories";
import { formatTravelTime } from "@/lib/utils";

function MiniSave({ placeId }: { placeId: string }) {
  const saved = useIsSaved(placeId);
  return (
    <button
      onClick={() => toggleSaved(placeId)}
      className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
    >
      {saved ? <Check size={13} className="text-tide-300" /> : <Plus size={13} />}
      {saved ? "In trip" : "Add to trip"}
    </button>
  );
}

export function TalaPanel() {
  const { isOpen, initialQuery, closeTala } = useTala();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<TalaMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef<string>();

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: q, createdAt: new Date().toISOString() },
    ]);
    setThinking(true);
    const weather = await getWeather().catch(() => undefined);
    const res = await askTala(q, { weather });
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "tala",
        content: res.message,
        places: res.places,
        suggestions: res.suggestions,
        createdAt: new Date().toISOString(),
      },
    ]);
    setThinking(false);
  };

  useEffect(() => {
    if (isOpen && initialQuery && sentInitial.current !== initialQuery) {
      sentInitial.current = initialQuery;
      void send(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialQuery]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ocean-950/60 backdrop-blur-xs" onClick={closeTala}>
      <section
        onClick={(e) => e.stopPropagation()}
        className="glass flex h-full w-full max-w-md animate-slide-in-right flex-col border-l border-white/10"
        role="dialog"
        aria-label="Tala, your San Vicente guide"
      >
        <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-tide-500/15 text-tide-300">
              <Sparkles size={17} />
            </span>
            <div className="leading-tight">
              <p className="font-display font-semibold text-mist-100">Tala</p>
              <p className="text-xs text-mist-400">Your San Vicente guide</p>
            </div>
          </div>
          <button
            onClick={closeTala}
            aria-label="Close Tala"
            className="rounded-full p-2 text-mist-400 hover:bg-white/5 hover:text-mist-100"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="animate-fade-up">
              <p className="text-sm leading-relaxed text-mist-300">
                Mabuhay. I know San Vicente's beaches, boats, food, falls, and what's good right
                now. What are you in the mood for?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TALA_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="chip border border-white/10 bg-white/5 text-mist-300 hover:border-tide-400/30 hover:text-tide-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-tide-500/20 px-3.5 py-2 text-sm text-mist-100">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={m.id} className="animate-fade-up space-y-2.5">
                <p className="max-w-[95%] rounded-2xl rounded-bl-sm bg-white/[0.05] px-3.5 py-2.5 text-sm leading-relaxed text-mist-200">
                  {m.content}
                </p>
                {m.places?.map((p) => {
                  const meta = categoryMeta(p.category);
                  const travel = formatTravelTime(p.travelMinutesFromPoblacion, p.travelNote);
                  return (
                    <div key={p.id} className="rounded-xl border border-white/[0.08] bg-ocean-850/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/place/${p.slug}`}
                          onClick={closeTala}
                          className="min-w-0 truncate font-medium text-mist-100 hover:text-tide-300"
                        >
                          {p.name}
                        </Link>
                        <span className="shrink-0 text-xs" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      {travel && <p className="mt-0.5 text-xs text-mist-400">{travel}</p>}
                      <div className="mt-2 flex gap-2">
                        <MiniSave placeId={p.id} />
                        <button
                          onClick={() => {
                            closeTala();
                            navigate(`/explore?focus=${p.slug}`);
                          }}
                          className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
                        >
                          <MapPin size={13} />
                          Map
                        </button>
                      </div>
                    </div>
                  );
                })}
                {m.suggestions && (
                  <div className="flex flex-wrap gap-2">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="chip border border-white/10 bg-white/5 text-mist-400 hover:border-tide-400/30 hover:text-tide-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}

          {thinking && (
            <p className="flex items-center gap-2 text-sm text-mist-400">
              <Sparkles size={14} className="animate-pulse text-tide-400" />
              Tala is thinking…
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-white/[0.08] p-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 focus-within:border-tide-400/40">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about beaches, food, sunset…"
              className="h-9 flex-1 bg-transparent text-sm text-mist-100 placeholder:text-mist-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send"
              className="grid h-8 w-8 place-items-center rounded-full bg-tide-500/20 text-tide-300 transition-opacity disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
