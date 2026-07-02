import { Link, useNavigate } from "react-router-dom";
import { MapPin, Star, Clock } from "lucide-react";
import type { Place } from "@/types";
import { categoryMeta } from "@/data/categories";
import { formatTravelTime } from "@/lib/utils";
import { PlaceImage } from "./PlaceImage";
import { SaveButton } from "./SaveButton";

// The standard place card: image, name, category, reason, travel time,
// save + view-on-map. Used on Today, Explore lists, and Tala answers.

export function PlaceCard({
  place,
  headline,
  reason,
}: {
  place: Place;
  /** Optional recommendation title, e.g. "Best sunset spot tonight". */
  headline?: string;
  /** Overrides the place's default shortReason (recommendation copy). */
  reason?: string;
}) {
  const meta = categoryMeta(place.category);
  const navigate = useNavigate();
  const travel = formatTravelTime(place.travelMinutesFromPoblacion, place.travelNote);

  return (
    <article className="glass glass-hover group overflow-hidden rounded-2xl">
      <Link to={`/place/${place.slug}`} className="block">
        <div className="flex gap-0">
          <PlaceImage place={place} className="h-32 w-28 shrink-0 sm:w-36" />
          <div className="min-w-0 flex-1 p-3.5">
            {headline && (
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-tide-300">
                {headline}
              </p>
            )}
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-display text-base font-semibold text-mist-100">
                {place.name}
              </h3>
              {place.rating && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-sand-300">
                  <Star size={12} className="fill-current" />
                  {place.rating.toFixed(1)}
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-mist-400">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: meta.color }}
              />
              {meta.label}
              <span className="text-mist-500">·</span>
              {place.barangay}
            </p>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-mist-300">
              {reason ?? place.shortReason}
            </p>
            {travel && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-mist-400">
                <Clock size={12} />
                {travel}
              </p>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-3.5 py-2">
        <SaveButton placeId={place.id} withLabel />
        <button
          onClick={() => navigate(`/explore?focus=${place.slug}`)}
          className="chip border border-white/10 bg-white/5 text-mist-300 hover:bg-white/10 hover:text-mist-100"
        >
          <MapPin size={14} />
          View on map
        </button>
      </div>
    </article>
  );
}
