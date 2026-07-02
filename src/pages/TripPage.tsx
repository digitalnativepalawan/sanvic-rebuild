import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Compass,
  MapPin,
  Route,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { Place, TripDay, TripItem } from "@/types";
import { useTripItems } from "@/hooks/useTrip";
import { getPlaces } from "@/services/placesService";
import { moveToDay, removePlace, reorder } from "@/services/tripService";
import { distanceKm, formatTravelTime } from "@/lib/utils";
import { POBLACION } from "@/data/places";
import { categoryMeta } from "@/data/categories";
import { PlaceImage } from "@/components/places/PlaceImage";
import { useTala } from "@/components/tala/TalaContext";

// Trip: saved places organized into Today / Tomorrow / Later, with a
// suggested visiting order (nearest-neighbor from Poblacion) per day.

const DAYS: { id: TripDay; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "later", label: "Saved for later" },
];

function suggestOrder(items: { item: TripItem; place: Place }[]) {
  // Greedy nearest-neighbor starting from Poblacion — a good-enough route
  // hint at municipal scale, not a TSP solver.
  const remaining = [...items];
  const ordered: typeof items = [];
  let cursor = POBLACION;
  while (remaining.length) {
    remaining.sort((a, b) => distanceKm(cursor, a.place) - distanceKm(cursor, b.place));
    const next = remaining.shift()!;
    ordered.push(next);
    cursor = next.place;
  }
  return ordered;
}

function TripRow({
  item,
  place,
  isFirst,
  isLast,
}: {
  item: TripItem;
  place: Place;
  isFirst: boolean;
  isLast: boolean;
}) {
  const meta = categoryMeta(place.category);
  const travel = formatTravelTime(place.travelMinutesFromPoblacion, place.travelNote);
  return (
    <div className="glass flex items-center gap-3 rounded-xl p-2.5">
      <PlaceImage place={place} className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Link
          to={`/place/${place.slug}`}
          className="block truncate font-medium text-mist-100 hover:text-tide-300"
        >
          {place.name}
        </Link>
        <p className="flex items-center gap-1.5 text-xs text-mist-400">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
          {meta.label}
          {travel && (
            <>
              <span className="text-mist-500">·</span> {travel}
            </>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {DAYS.filter((d) => d.id !== item.day).map((d) => (
            <button
              key={d.id}
              onClick={() => moveToDay(item.id, d.id)}
              className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-mist-400 hover:border-tide-400/30 hover:text-tide-300"
            >
              → {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          onClick={() => reorder(item.id, -1)}
          disabled={isFirst}
          aria-label="Move up"
          className="rounded p-1 text-mist-400 hover:bg-white/5 disabled:opacity-25"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={() => removePlace(place.id)}
          aria-label="Remove from trip"
          className="rounded p-1 text-mist-500 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={() => reorder(item.id, 1)}
          disabled={isLast}
          aria-label="Move down"
          className="rounded p-1 text-mist-400 hover:bg-white/5 disabled:opacity-25"
        >
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TripPage() {
  const items = useTripItems();
  const [places, setPlaces] = useState<Place[]>([]);
  const { openTala } = useTala();

  useEffect(() => {
    void getPlaces().then(setPlaces);
  }, []);

  const byDay = useMemo(() => {
    const placeMap = new Map(places.map((p) => [p.id, p]));
    const result = new Map<TripDay, { item: TripItem; place: Place }[]>();
    for (const { id } of DAYS) {
      const dayItems = items
        .filter((i) => i.day === id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .flatMap((item) => {
          const place = placeMap.get(item.placeId);
          return place ? [{ item, place }] : [];
        });
      result.set(id, dayItems);
    }
    return result;
  }, [items, places]);

  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="pt-2 md:pt-6">
        <h1 className="font-display text-3xl font-semibold text-mist-100">Your trip</h1>
        <p className="mt-1 text-sm text-mist-400">
          Saved places, organized by day. Everything stays on this device — no account needed.
        </p>
      </header>

      {isEmpty ? (
        <div className="glass grid place-items-center gap-4 rounded-2xl px-6 py-14 text-center">
          <Compass size={36} className="text-tide-400" />
          <div>
            <p className="font-display text-lg font-medium text-mist-100">Nothing saved yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-mist-400">
              Tap the heart on any place — from Today, the map, or a Tala answer — and it lands
              here, ready to become a plan.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/explore" className="chip border border-tide-400/30 bg-tide-500/10 text-tide-300">
              <MapPin size={14} />
              Explore the map
            </Link>
            <button
              onClick={() => openTala("Plan a slow day near Poblacion")}
              className="chip border border-white/10 bg-white/5 text-mist-300"
            >
              <Sparkles size={14} />
              Ask Tala for a plan
            </button>
          </div>
        </div>
      ) : (
        <>
          {DAYS.map(({ id, label }) => {
            const dayItems = byDay.get(id) ?? [];
            if (dayItems.length === 0 && id === "later") return null;
            const route = id !== "later" && dayItems.length > 1 ? suggestOrder(dayItems) : null;
            return (
              <section key={id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-tide-400" />
                  <h2 className="font-display text-lg font-semibold text-mist-100">{label}</h2>
                  <span className="text-xs text-mist-500">
                    {dayItems.length} {dayItems.length === 1 ? "place" : "places"}
                  </span>
                </div>
                {dayItems.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-mist-500">
                    Move a saved place here to plan your {label.toLowerCase()}.
                  </p>
                ) : (
                  <>
                    {route && (
                      <p className="flex items-start gap-2 rounded-xl bg-tide-500/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-tide-300/90">
                        <Route size={14} className="mt-0.5 shrink-0" />
                        <span>
                          Suggested order from Poblacion:{" "}
                          {route.map(({ place }, i) => (
                            <span key={place.id}>
                              {i > 0 && " → "}
                              <strong className="font-medium">{place.name}</strong>
                            </span>
                          ))}
                        </span>
                      </p>
                    )}
                    <div className="space-y-2">
                      {dayItems.map(({ item, place }, i) => (
                        <TripRow
                          key={item.id}
                          item={item}
                          place={place}
                          isFirst={i === 0}
                          isLast={i === dayItems.length - 1}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}

          <button
            disabled
            className="chip cursor-not-allowed border border-white/10 bg-white/[0.03] text-mist-500"
            title="Trip sharing arrives with Supabase sync"
          >
            <Share2 size={14} />
            Share trip — coming soon
          </button>
        </>
      )}
    </div>
  );
}
