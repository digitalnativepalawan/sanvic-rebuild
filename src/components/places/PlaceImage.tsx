import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";
import { categoryMeta } from "@/data/categories";

// Image with a designed fallback: when a place has no photo (or it fails to
// load) we render a category-tinted gradient with the category icon — never
// a broken image or an empty gray box.

export function PlaceImage({ place, className }: { place: Place; className?: string }) {
  const [failed, setFailed] = useState(false);
  const meta = categoryMeta(place.category);
  const showImage = place.imageUrl && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-ocean-800", className)}>
      {showImage ? (
        <img
          src={place.imageUrl}
          alt={place.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center"
          style={{
            background: `linear-gradient(140deg, ${meta.color}26 0%, #0e2440 70%)`,
          }}
        >
          <meta.icon size={28} style={{ color: meta.color }} className="opacity-70" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-950/70 via-transparent to-transparent" />
    </div>
  );
}
