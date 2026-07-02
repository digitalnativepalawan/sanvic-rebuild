import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronUp, Navigation, Star, X } from "lucide-react";
import type { Place, PlaceCategory } from "@/types";
import { getPlaces, filterByCategory } from "@/services/placesService";
import { CATEGORIES } from "@/data/categories";
import { cn, formatTravelTime, googleMapsDirectionsUrl } from "@/lib/utils";
import { ExploreMap } from "@/components/map/ExploreMap";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceImage } from "@/components/places/PlaceImage";
import { SaveButton } from "@/components/places/SaveButton";

// Explore: map-first discovery. Desktop = list panel + map side by side.
// Mobile = full-bleed map with a draggable-feel bottom sheet.

function CategoryChips({
  active,
  onChange,
}: {
  active: PlaceCategory | "all";
  onChange: (c: PlaceCategory | "all") => void;
}) {
  return (
    <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "chip shrink-0 border",
          active === "all"
            ? "border-tide-400/40 bg-tide-500/15 text-tide-300"
            : "border-white/10 bg-white/5 text-mist-300",
        )}
      >
        All
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "chip shrink-0 border",
            active === c.id
              ? "border-white/25 text-mist-100"
              : "border-white/10 bg-white/5 text-mist-300",
          )}
          style={active === c.id ? { background: `${c.color}26` } : undefined}
        >
          <c.icon size={13} style={{ color: c.color }} />
          {c.label}
        </button>
      ))}
    </div>
  );
}

function SelectedPreview({ place, onClose }: { place: Place; onClose: () => void }) {
  const travel = formatTravelTime(place.travelMinutesFromPoblacion, place.travelNote);
  return (
    <div className="glass animate-fade-up overflow-hidden rounded-2xl">
      <div className="flex">
        <PlaceImage place={place} className="h-28 w-28 shrink-0" />
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/place/${place.slug}`}
              className="truncate font-display text-base font-semibold text-mist-100 hover:text-tide-300"
            >
              {place.name}
            </Link>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="shrink-0 rounded-full p-1 text-mist-400 hover:bg-white/5"
            >
              <X size={15} />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-mist-400">
            {place.barangay}
            {place.rating && (
              <span className="ml-2 inline-flex items-center gap-1 text-sand-300">
                <Star size={11} className="fill-current" />
                {place.rating.toFixed(1)}
              </span>
            )}
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] text-mist-300">{place.shortReason}</p>
          {travel && <p className="mt-1 text-xs text-mist-400">{travel}</p>}
        </div>
      </div>
      <div className="flex gap-2 border-t border-white/[0.06] px-3 py-2">
        <SaveButton placeId={place.id} withLabel />
        <a
          href={googleMapsDirectionsUrl(place.latitude, place.longitude)}
          target="_blank"
          rel="noreferrer"
          className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
        >
          <Navigation size={13} />
          Directions
        </a>
        <Link
          to={`/place/${place.slug}`}
          className="chip ml-auto border border-tide-400/30 bg-tide-500/10 text-tide-300"
        >
          Details
        </Link>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<PlaceCategory | "all">(
    (params.get("category") as PlaceCategory) ?? "all",
  );
  const [selected, setSelected] = useState<Place>();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    void getPlaces().then(setPlaces);
  }, []);

  // Deep-link focus (?focus=slug) from Today cards / Tala.
  useEffect(() => {
    const focus = params.get("focus");
    if (focus && places.length) {
      const p = places.find((x) => x.slug === focus);
      if (p) setSelected(p);
    }
  }, [params, places]);

  const visible = useMemo(() => filterByCategory(places, category), [places, category]);

  const handleSelect = useCallback(
    (p: Place) => {
      setSelected(p);
      setSheetOpen(false);
      if (params.get("focus") !== p.slug) {
        params.set("focus", p.slug);
        setParams(params, { replace: true });
      }
    },
    [params, setParams],
  );

  return (
    <div className="relative h-[calc(100dvh-4rem)]">
      {/* Desktop layout */}
      <div className="hidden h-full md:flex">
        <aside className="scroll-thin w-[400px] shrink-0 space-y-3 overflow-y-auto p-4">
          <CategoryChips active={category} onChange={setCategory} />
          {selected && <SelectedPreview place={selected} onClose={() => setSelected(undefined)} />}
          <p className="px-1 text-xs uppercase tracking-wider text-mist-500">
            {visible.length} places
          </p>
          {visible.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </aside>
        <div className="flex-1">
          <ExploreMap places={visible} selected={selected} onSelect={handleSelect} />
        </div>
      </div>

      {/* Mobile layout: full-bleed map + bottom sheet */}
      <div className="h-full md:hidden">
        <ExploreMap places={visible} selected={selected} onSelect={handleSelect} />

        {/* Floating category chips over the map */}
        <div className="absolute inset-x-0 top-0 z-[1000] p-3">
          <CategoryChips active={category} onChange={setCategory} />
        </div>

        {/* Selected place preview pinned above the sheet toggle */}
        <div className="absolute inset-x-0 bottom-0 z-[1000] space-y-2 p-3">
          {selected && !sheetOpen && (
            <SelectedPreview place={selected} onClose={() => setSelected(undefined)} />
          )}
          {!sheetOpen && (
            <button
              onClick={() => setSheetOpen(true)}
              className="glass mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-mist-200"
            >
              <ChevronUp size={16} />
              {visible.length} places
            </button>
          )}
        </div>

        {sheetOpen && (
          <div className="absolute inset-x-0 bottom-0 z-[1001] max-h-[70%] animate-slide-up">
            <div className="glass scroll-thin h-full space-y-3 overflow-y-auto rounded-t-3xl p-4 pb-6">
              <button
                onClick={() => setSheetOpen(false)}
                className="mx-auto block h-1.5 w-12 rounded-full bg-white/20"
                aria-label="Close list"
              />
              {visible.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
