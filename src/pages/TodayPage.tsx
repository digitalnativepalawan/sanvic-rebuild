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
} from "lucide-react";
import type { LocalUpdate } from "@/types";
import { useWeather } from "@/hooks/useWeather";
import { getTimeOfDay, timeOfDayGreeting } from "@/lib/utils";
import { getTodayRecommendations } from "@/services/recommendationEngine";
import { getLocalUpdates } from "@/services/placesService";
import { useTala } from "@/components/tala/TalaContext";
import { PlaceCard } from "@/components/places/PlaceCard";
import { TALA_SUGGESTIONS } from "@/services/talaService";

// Today: the primary screen. Answers "what is worth doing in San Vicente
// right now?" — weather + local cues + ranked recommendations + Ask Tala.

const WEATHER_ICON = { clear: Sun, cloudy: CloudSun, rain: CloudRain };

export default function TodayPage() {
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
    <div className="space-y-8">
      {/* Hero: greeting, weather, ask */}
      <section className="animate-fade-up space-y-4 pt-2 md:pt-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-tide-400">
            {timeOfDayGreeting(timeOfDay)}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-mist-100 md:text-4xl">
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
          className="glass flex items-center gap-2 rounded-full py-1.5 pl-4 pr-2 focus-within:border-tide-400/40"
        >
          <Sparkles size={16} className="shrink-0 text-tide-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Tala — “Where should I watch sunset tonight?”"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-mist-100 placeholder:text-mist-500 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-tide-500/20 px-4 py-2 text-sm font-medium text-tide-300 hover:bg-tide-500/30"
          >
            Ask
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {TALA_SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => openTala(s)}
              className="chip border border-white/10 bg-white/[0.04] text-mist-400 hover:border-tide-400/30 hover:text-tide-300"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Top local signal */}
      {topUpdate && (
        <Link
          to="/pulse"
          className="glass glass-hover flex items-center gap-3 rounded-2xl px-4 py-3"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tide-500/15 text-tide-300">
            <RadioTower size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-mist-100">
              {topUpdate.title}
            </span>
            <span className="block truncate text-xs text-mist-400">{topUpdate.body}</span>
          </span>
          <ArrowRight size={16} className="shrink-0 text-mist-400" />
        </Link>
      )}

      {/* Recommendations */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold text-mist-100">Worth it right now</h2>
          <Link to="/explore" className="text-sm text-tide-300 hover:text-tide-400">
            Open the map →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations.map((r) => (
            <PlaceCard key={r.id} place={r.place} headline={r.title} reason={r.reason} />
          ))}
        </div>
      </section>
    </div>
  );
}
