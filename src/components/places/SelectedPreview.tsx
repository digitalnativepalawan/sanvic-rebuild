import { Link } from "react-router-dom";
import { Navigation, Star, X } from "lucide-react";
import type { Place } from "@/types";
import { formatTravelTime, googleMapsDirectionsUrl } from "@/lib/utils";
import { PlaceImage } from "./PlaceImage";
import { SaveButton } from "./SaveButton";

// Compact preview card for the place selected on a map — shared by the
// root map and Explore.

export function SelectedPreview({ place, onClose }: { place: Place; onClose: () => void }) {
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
