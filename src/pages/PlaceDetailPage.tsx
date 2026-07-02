import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Sparkles,
  Star,
} from "lucide-react";
import type { Place } from "@/types";
import { getPlaceBySlug, getPlacesSync } from "@/services/placesService";
import { categoryMeta } from "@/data/categories";
import { distanceKm, formatTravelTime, googleMapsDirectionsUrl } from "@/lib/utils";
import { PlaceImage } from "@/components/places/PlaceImage";
import { PlaceCard } from "@/components/places/PlaceCard";
import { SaveButton } from "@/components/places/SaveButton";
import { useTala } from "@/components/tala/TalaContext";

export default function PlaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { openTala } = useTala();
  const [place, setPlace] = useState<Place | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    void getPlaceBySlug(slug).then((p) => setPlace(p ?? null));
  }, [slug]);

  if (place === undefined) return null;
  if (place === null) {
    return (
      <div className="mx-auto max-w-2xl pt-10 text-center">
        <p className="text-mist-300">That place isn't in the guide yet.</p>
        <Link to="/explore" className="mt-3 inline-block text-tide-300">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  const meta = categoryMeta(place.category);
  const travel = formatTravelTime(place.travelMinutesFromPoblacion, place.travelNote);
  const nearby = getPlacesSync()
    .filter((p) => p.id !== place.id)
    .sort((a, b) => distanceKm(place, a) - distanceKm(place, b))
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="mt-2 flex items-center gap-1.5 text-sm text-mist-400 hover:text-mist-100 md:mt-4"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="glass animate-fade-up overflow-hidden rounded-3xl">
        <PlaceImage place={place} className="h-56 w-full md:h-72" />
        <div className="space-y-4 p-5 md:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border border-white/10 bg-white/5" style={{ color: meta.color }}>
                <meta.icon size={13} />
                {meta.label}
              </span>
              {place.rating && (
                <span className="chip border border-white/10 bg-white/5 text-sand-300">
                  <Star size={13} className="fill-current" />
                  {place.rating.toFixed(1)}
                </span>
              )}
              {place.priceLevel && (
                <span className="chip border border-white/10 bg-white/5 text-mist-300">
                  {"₱".repeat(place.priceLevel)}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold text-mist-100">
              {place.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-mist-400">
              <MapPin size={14} />
              Barangay {place.barangay}
            </p>
          </div>

          <p className="text-[15px] leading-relaxed text-mist-200">{place.description}</p>

          <div className="grid gap-2 text-sm sm:grid-cols-3">
            {travel && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <p className="flex items-center gap-1.5 text-xs text-mist-500">
                  <Clock size={12} /> Getting there
                </p>
                <p className="mt-1 text-mist-200">{travel}</p>
              </div>
            )}
            {place.bestTime && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <p className="flex items-center gap-1.5 text-xs text-mist-500">
                  <Clock size={12} /> Best time
                </p>
                <p className="mt-1 text-mist-200">{place.bestTime}</p>
              </div>
            )}
            {place.bestSeason && (
              <div className="rounded-xl bg-white/[0.04] p-3">
                <p className="flex items-center gap-1.5 text-xs text-mist-500">
                  <Calendar size={12} /> Best season
                </p>
                <p className="mt-1 text-mist-200">{place.bestSeason}</p>
              </div>
            )}
          </div>

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-mist-400">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-4">
            <a
              href={googleMapsDirectionsUrl(place.latitude, place.longitude)}
              target="_blank"
              rel="noreferrer"
              className="chip border border-tide-400/30 bg-tide-500/15 text-tide-300 hover:bg-tide-500/25"
            >
              <Navigation size={14} />
              Directions
            </a>
            <SaveButton placeId={place.id} withLabel />
            <button
              onClick={() => openTala(`Tell me about ${place.name} — when should I go and what should I know?`)}
              className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
            >
              <Sparkles size={14} />
              Ask Tala
            </button>
            <button
              onClick={() => navigate(`/explore?focus=${place.slug}`)}
              className="chip border border-white/10 bg-white/5 text-mist-300 hover:text-mist-100"
            >
              <MapPin size={14} />
              View on map
            </button>
          </div>
        </div>
      </div>

      {nearby.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-mist-100">Nearby</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {nearby.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
