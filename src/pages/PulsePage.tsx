import { useEffect, useMemo, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import type { LocalUpdate, UpdateCategory } from "@/types";
import { getLocalUpdates } from "@/services/placesService";
import { useWeather } from "@/hooks/useWeather";
import { cn, timeAgo } from "@/lib/utils";

// Pulse: local updates — trustworthy signals about conditions, food, roads,
// boats, and events. Not a social feed.

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

export default function PulsePage() {
  const [updates, setUpdates] = useState<LocalUpdate[]>([]);
  const [filter, setFilter] = useState<UpdateCategory | "all">("all");
  const weather = useWeather();

  useEffect(() => {
    void getLocalUpdates().then(setUpdates);
  }, []);

  // Live weather becomes a first-class update at the top of the feed.
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="pt-2 md:pt-6">
        <h1 className="font-display text-3xl font-semibold text-mist-100">Pulse</h1>
        <p className="mt-1 text-sm text-mist-400">
          What's actually happening in San Vicente — conditions, boats, roads, food, and events.
        </p>
      </header>

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
