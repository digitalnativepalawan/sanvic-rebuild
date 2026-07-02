import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Sun,
  CloudSun,
  CloudRain,
  Sunset,
  Wind,
  ArrowRight,
  RadioTower,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { LocalUpdate, Place } from "@/types";
import { useWeather } from "@/hooks/useWeather";
import { cn, getTimeOfDay, timeOfDayGreeting } from "@/lib/utils";
import { getTodayRecommendations } from "@/services/recommendationEngine";
import { getLocalUpdates, getPlaces } from "@/services/placesService";
import { useTala } from "@/components/tala/TalaContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ExploreMap } from "@/components/map/ExploreMap";
import { PlaceCard } from "@/components/places/PlaceCard";
import { SelectedPreview } from "@/components/places/SelectedPreview";
import { TALA_SUGGESTIONS } from "@/services/talaService";

// Today: the launch screen. Opening SANVIC means landing inside the living
// San Vicente map — barangay lines and destination pins visible immediately —
// with today's ranked recommendations as a map-connected overlay (side panel
// on desktop, bottom sheet on mobile). Today recommends; the map reveals.

const WEATHER_ICON = { clear: Sun, cloudy: CloudSun, rain: CloudRain };

function TodayContent({
  onViewMap,
  compact,
}: {
  onViewMap: (place: Place) => void;
  compact?: boolean;
}) {
  const weather = useWeather();
  const { openTala } = useTala();
  const [query, setQuery] = useState("");
  const [topUpdate, setTopUpdate] = useState<LocalUpdate>();
  const timeOfDay = getTimeOfDay();

  const recommendations = useMemo(
    () => getTodayRecommendations(timeOfDay, weather, 5),
    [timeOfDay, weather],
  );

  useEffect(() => {
    void getLocalUpdates().then((u) => setTopUpdate(u.find((x) => x.severity !== "info") ?? u[0]));
  }, []);

  const WeatherIcon = weather ? WEATHER_ICON[weather.condition] : Sun;
  const headline =
    weather?.condition === "rain"
      ? "Rain on the coast — here's how to play it."
      : timeOfDay === "sunset"
        ? "Golden hour is close. Get in position."
        : timeOfDay === "evening"
          ? "The island slows down. So should you."
          : "A good day to be in San Vicente.";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-tide-400">
          {timeOfDayGreeting(timeOfDay)}
        </p>
        <h1
          className={cn(
            "mt-1 font-display font-semibold leading-tight text-mist-100",
            compact ? "text-xl" : "text-2xl",
          )}
        >
          {headline}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="chip glass text-mist-200">
          <WeatherIcon size={14} className="text-sand-300" />
          {weather ? `${weather.tempC}°C · ${weather.label}` : "Checking conditions…"}
        </span>
        {weather?.sunset && (
          <span className="chip glass text-mist-200">
            <Sunset size={14} className="text-sand-300" />
            Sunset {weather.sunset}
          </span>
        )}
        {weather && weather.windKmh >= 20 && (
          <span className="chip glass text-mist-200">
            <Wind size={14} className="text-tide-300" />
            Breezy {weather.windKmh} km/h
          </span>
        )}
        {weather && !weather.isLive && (
          <span className="chip border border-white/10 text-mist-500">seasonal estimate</span>
        )}
      </div>

      {/* Ask Tala */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openTala(query.trim() || undefined);
          setQuery("");
        }}
        className="glass flex items-center gap-2 rounded-full py-1 pl-4 pr-1.5 focus-within:border-tide-400/40"
      >
        <Sparkles size={15} className="shrink-0 text-tide-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Tala — “Where should I watch sunset?”"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-mist-100 placeholder:text-mist-500 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-tide-500/20 px-3.5 py-1.5 text-sm font-medium text-tide-300 hover:bg-tide-500/30"
        >
          Ask
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {TALA_SUGGESTIONS.slice(0, 2).map((s) => (
          <button
            key={s}
            onClick={() => openTala(s)}
            className="chip border border-white/10 bg-white/[0.04] text-mist-400 hover:border-tide-400/30 hover:text-tide-300"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Top local signal */}
      {topUpdate && (
        <Link
          to="/pulse"
          className="glass glass-hover flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tide-500/15 text-tide-300">
            <RadioTower size={15} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-mist-100">
              {topUpdate.title}
            </span>
            <span className="block truncate text-xs text-mist-400">{topUpdate.body}</span>
          </span>
          <ArrowRight size={15} className="shrink-0 text-mist-400" />
        </Link>
      )}

      {/* Recommendations */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold text-mist-100">
            Worth it right now
          </h2>
          <Link to="/explore" className="text-sm text-tide-300 hover:text-tide-400">
            Open Explorer →
          </Link>
        </div>
        <div className="space-y-3">
          {recommendations.map((r) => (
            <PlaceCard
              key={r.id}
              place={r.place}
              headline={r.title}
              reason={r.reason}
              onViewMap={onViewMap}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function TodayPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place>();
  // Sheet starts at peek height so launch reads "I am inside the map".
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Fit the municipality into the space not covered by the Today overlay
  // (left panel on desktop, peek sheet on mobile).
  const boundsOptions = useMemo(
    () =>
      isDesktop
        ? { paddingTopLeft: [436, 16] as [number, number], paddingBottomRight: [16, 16] as [number, number] }
        : { paddingTopLeft: [12, 12] as [number, number], paddingBottomRight: [12, 148] as [number, number] },
    [isDesktop],
  );

  useEffect(() => {
    void getPlaces().then(setPlaces);
  }, []);

  // "View on map" from a Today card: focus that pin. On mobile, drop the
  // sheet to its peek state so the map is what the user sees.
  const handleViewMap = (p: Place) => {
    setSelected(p);
    setSheetOpen(false);
  };

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
      {/* The map IS the launch screen — boundaries + pins visible immediately */}
      <ExploreMap
        places={places}
        selected={selected}
        onSelect={setSelected}
        boundsOptions={boundsOptions}
      />

      {isDesktop ? (
        /* Desktop: Today panel floats over the left side of the map */
        <div className="absolute bottom-4 left-4 top-4 z-[1000] w-[404px]">
          <div className="glass scroll-thin h-full space-y-4 overflow-y-auto rounded-3xl p-5">
            {selected && (
              <SelectedPreview place={selected} onClose={() => setSelected(undefined)} />
            )}
            <TodayContent onViewMap={handleViewMap} />
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: selected pin preview floats above the sheet */}
          {selected && !sheetOpen && (
            <div className="absolute inset-x-0 bottom-0 z-[1001] p-3 pb-[calc(9rem+env(safe-area-inset-bottom))]">
              <SelectedPreview place={selected} onClose={() => setSelected(undefined)} />
            </div>
          )}

          {/* Mobile: Today bottom sheet. Peek keeps the map dominant. */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-[1000] transition-all",
              sheetOpen ? "max-h-[68%]" : "max-h-[8.5rem]",
            )}
          >
            <div className="glass flex h-full flex-col rounded-t-3xl pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
              <button
                onClick={() => setSheetOpen((o) => !o)}
                aria-label={sheetOpen ? "Collapse Today panel" : "Expand Today panel"}
                className="flex w-full flex-col items-center gap-1 pb-1 pt-2.5 text-mist-400"
              >
                <span className="h-1.5 w-12 rounded-full bg-white/20" />
                {sheetOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
              <div
                className={cn(
                  "scroll-thin min-h-0 flex-1 px-4 pb-3",
                  sheetOpen ? "overflow-y-auto" : "overflow-hidden",
                )}
              >
                <TodayContent onViewMap={handleViewMap} compact />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
