import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import type { Place, PlaceCategory } from "@/types";
import { getPlaces, filterByCategory } from "@/services/placesService";
import { CATEGORIES } from "@/data/categories";
import { cn } from "@/lib/utils";
import { ExploreMap } from "@/components/map/ExploreMap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PlaceCard } from "@/components/places/PlaceCard";
import { SelectedPreview } from "@/components/places/SelectedPreview";

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

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<PlaceCategory | "all">(
    (params.get("category") as PlaceCategory) ?? "all",
  );
  const [selected, setSelected] = useState<Place>();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Render exactly one layout (and one Leaflet instance) per breakpoint.
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
      {isDesktop ? (
        <div className="flex h-full">
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
      ) : (
      /* Mobile layout: full-bleed map + bottom sheet */
      <div className="h-full">
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
      )}
    </div>
  );
}
