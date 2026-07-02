import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Umbrella,
  Sunset,
  UtensilsCrossed,
  CarFront,
  Sailboat,
  CalendarDays,
  CloudSun,
  Lightbulb,
  MapPin,
  RadioTower,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { LocalUpdate, UpdateCategory } from "@/types";
import { getLocalUpdates } from "@/services/placesService";
import { useWeather } from "@/hooks/useWeather";
import { useAuth } from "@/hooks/useAuth";
import { cn, timeAgo } from "@/lib/utils";
import {
  fetchPosts,
  isFeedAvailable,
  subscribeToNewPosts,
  PULSE_CHANNELS,
  type PulseChannel,
  type PulsePost,
} from "@/services/pulseFeedService";
import { PulseComposer } from "@/components/pulse/PulseComposer";
import { PulsePostCard } from "@/components/pulse/PulsePostCard";
import { LoginModal } from "@/components/auth/LoginModal";

// Pulse: two things live under one roof.
// - Live Feed: the community — real posts from real people, channels,
//   photos/video, likes and comments (requires Supabase).
// - Local Updates: trustworthy admin-curated signals (conditions, boats,
//   roads, events) — unchanged from before.

const CATEGORY_META: Record<UpdateCategory, { label: string; icon: LucideIcon; color: string }> = {
  beach: { label: "Beach", icon: Umbrella, color: "#38bdf8" },
  sunset: { label: "Sunset", icon: Sunset, color: "#fb923c" },
  food: { label: "Food", icon: UtensilsCrossed, color: "#facc15" },
  travel: { label: "Roads & travel", icon: CarFront, color: "#a78bfa" },
  "island-hopping": { label: "Island hopping", icon: Sailboat, color: "#2dd4bf" },
  event: { label: "Event", icon: CalendarDays, color: "#f87171" },
  weather: { label: "Weather", icon: CloudSun, color: "#5eead4" },
  tip: { label: "Local tip", icon: Lightbulb, color: "#f472b6" },
};

const SEVERITY_STYLE = {
  good: "border-tide-400/30 bg-tide-500/10 text-tide-300",
  info: "border-white/10 bg-white/5 text-mist-300",
  watch: "border-sand-300/30 bg-sand-300/10 text-sand-300",
  alert: "border-rose-400/40 bg-rose-500/10 text-rose-300",
} as const;

const SEVERITY_LABEL = { good: "Good", info: "Info", watch: "Watch", alert: "Alert" } as const;

function UpdateCard({ update }: { update: LocalUpdate }) {
  const meta = CATEGORY_META[update.category];
  return (
    <article className="glass overflow-hidden rounded-2xl">
      {update.imageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img src={update.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 to-transparent" />
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip border border-white/10 bg-white/5" style={{ color: meta.color }}>
            <meta.icon size={13} />
            {meta.label}
          </span>
          <span className={cn("chip border text-[11px]", SEVERITY_STYLE[update.severity])}>
            {SEVERITY_LABEL[update.severity]}
          </span>
          <span className="ml-auto text-xs text-mist-500">{timeAgo(update.createdAt)}</span>
        </div>
        <h3 className="font-display text-base font-semibold text-mist-100">{update.title}</h3>
        <p className="text-sm leading-relaxed text-mist-300">{update.body}</p>
        <p className="flex items-center gap-3 pt-1 text-xs text-mist-500">
          {update.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {update.location}
            </span>
          )}
          <span>Source: {update.source}</span>
        </p>
      </div>
    </article>
  );
}

function LiveFeedTab() {
  const { isAdmin } = useAuth();
  const [channel, setChannel] = useState<PulseChannel>("all");
  const [posts, setPosts] = useState<PulsePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    void fetchPosts(channel)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [channel]);

  useEffect(() => reload(), [reload]);
  useEffect(() => subscribeToNewPosts(reload), [reload]);

  if (!isFeedAvailable) {
    return (
      <div className="glass grid place-items-center gap-2 rounded-2xl px-6 py-14 text-center">
        <Users size={30} className="text-mist-500" />
        <p className="font-display text-lg font-medium text-mist-100">Live Feed isn't connected</p>
        <p className="mx-auto max-w-sm text-sm text-mist-400">
          This build isn't wired to Supabase yet, so community posts aren't available. Local
          Updates still works.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
        {PULSE_CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannel(c.id)}
            className={cn(
              "chip shrink-0 border",
              channel === c.id
                ? "border-tide-400/40 bg-tide-500/15 text-tide-300"
                : "border-white/10 bg-white/5 text-mist-300",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <PulseComposer channel={channel} onPosted={reload} onRequireLogin={() => setShowLogin(true)} />

      {loading ? (
        <p className="py-8 text-center text-sm text-mist-500">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="glass rounded-2xl px-6 py-10 text-center text-sm text-mist-400">
          Nothing here yet — be the first to post in this channel.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PulsePostCard key={p.id} post={p} onChanged={reload} canModerate={!!isAdmin} />
          ))}
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function LocalUpdatesTab() {
  const [updates, setUpdates] = useState<LocalUpdate[]>([]);
  const [filter, setFilter] = useState<UpdateCategory | "all">("all");
  const weather = useWeather();

  useEffect(() => {
    void getLocalUpdates().then(setUpdates);
  }, []);

  const weatherUpdate: LocalUpdate | null = useMemo(() => {
    if (!weather?.isLive) return null;
    return {
      id: "u-live-weather",
      title: `Now: ${weather.tempC}°C, ${weather.label.toLowerCase()}`,
      body:
        weather.condition === "rain"
          ? "Showers over the coast. Boat trips may pause — cafés, the market, and (once it eases) the waterfalls are the smart plays."
          : `Wind ${weather.windKmh} km/h${weather.sunset ? `, sunset at ${weather.sunset}` : ""}. Conditions look good for the beach and the water.`,
      category: "weather",
      location: "San Vicente",
      severity: weather.condition === "rain" ? "watch" : "good",
      source: "Open-Meteo live data",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }, [weather]);

  const all = useMemo(
    () => (weatherUpdate ? [weatherUpdate, ...updates] : updates),
    [weatherUpdate, updates],
  );
  const visible = filter === "all" ? all : all.filter((u) => u.category === filter);
  const activeCategories = [...new Set(all.map((u) => u.category))];

  return (
    <div className="space-y-4">
      <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "chip shrink-0 border",
            filter === "all"
              ? "border-tide-400/40 bg-tide-500/15 text-tide-300"
              : "border-white/10 bg-white/5 text-mist-300",
          )}
        >
          All
        </button>
        {activeCategories.map((c) => {
          const meta = CATEGORY_META[c];
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "chip shrink-0 border",
                filter === c
                  ? "border-white/25 text-mist-100"
                  : "border-white/10 bg-white/5 text-mist-300",
              )}
              style={filter === c ? { background: `${meta.color}26` } : undefined}
            >
              <meta.icon size={13} style={{ color: meta.color }} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {visible.map((u) => (
          <UpdateCard key={u.id} update={u} />
        ))}
      </div>
    </div>
  );
}

export default function PulsePage() {
  const [tab, setTab] = useState<"live" | "updates">("live");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="pt-2 md:pt-6">
        <h1 className="font-display text-3xl font-semibold text-mist-100">Pulse</h1>
        <p className="mt-1 text-sm text-mist-400">
          The community, live — plus trustworthy signals about conditions, boats, roads, and events.
        </p>
      </header>

      <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setTab("live")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors",
            tab === "live" ? "bg-tide-500/15 text-tide-300" : "text-mist-400",
          )}
        >
          <Users size={14} />
          Live Feed
        </button>
        <button
          onClick={() => setTab("updates")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors",
            tab === "updates" ? "bg-tide-500/15 text-tide-300" : "text-mist-400",
          )}
        >
          <RadioTower size={14} />
          Local Updates
        </button>
      </div>

      {tab === "live" ? <LiveFeedTab /> : <LocalUpdatesTab />}
    </div>
  );
}
