import type {
  Place,
  Recommendation,
  RecommendationContext,
  TimeOfDay,
  WeatherSnapshot,
} from "@/types";
import { RECOMMENDATIONS } from "@/data/recommendations";
import { getPlacesSync } from "@/services/placesService";
import { createContentStore } from "@/services/contentService";

// The heart of "What should I do next?". Pure functions over the
// recommendations catalogue: given time of day + weather, return ranked,
// hydrated cards for the Today screen and for Tala. Later this can move to
// a Supabase Edge Function without touching the UI.

function fromRecommendationRow(row: Record<string, unknown>): Recommendation {
  const r = row as Record<string, never>;
  return {
    id: r["id"],
    placeId: r["place_id"],
    contextType: r["context_type"] as RecommendationContext,
    title: r["title"],
    reason: r["reason"],
    priority: (r["priority"] as number) ?? 10,
    weatherCondition:
      (r["weather_condition"] as Recommendation["weatherCondition"] | null) ?? undefined,
    audience: (r["audience"] as Recommendation["audience"] | null) ?? undefined,
    isActive: Boolean(r["is_active"]),
  };
}

function toRecommendationRow(rec: Recommendation): Record<string, unknown> {
  return {
    id: rec.id,
    place_id: rec.placeId,
    context_type: rec.contextType,
    title: rec.title,
    reason: rec.reason,
    priority: rec.priority,
    weather_condition: rec.weatherCondition ?? null,
    audience: rec.audience ?? null,
    is_active: rec.isActive,
  };
}

export const recommendationsStore = createContentStore<Recommendation>({
  storageKey: "sanvic.content.recommendations",
  seed: RECOMMENDATIONS,
  remote: {
    table: "recommendations",
    fromRow: fromRecommendationRow,
    toRow: toRecommendationRow,
  },
});

export interface RankedRecommendation extends Recommendation {
  place: Place;
}

function contextFor(time: TimeOfDay, weather?: WeatherSnapshot): RecommendationContext {
  if (weather?.condition === "rain") return "rainy";
  return time;
}

export function getTodayRecommendations(
  time: TimeOfDay,
  weather?: WeatherSnapshot,
  limit = 5,
): RankedRecommendation[] {
  const places = new Map(getPlacesSync().map((p) => [p.id, p]));
  const context = contextFor(time, weather);

  const eligible = recommendationsStore.getAll().filter((r) => {
    if (!r.isActive) return false;
    if (r.contextType !== context && r.contextType !== "any") return false;
    if (
      weather &&
      r.weatherCondition &&
      r.weatherCondition !== "any" &&
      r.weatherCondition !== weather.condition
    )
      return false;
    return places.has(r.placeId);
  });

  const ranked = eligible
    .sort((a, b) => {
      // Context-specific beats "any", then editorial priority.
      const aAny = a.contextType === "any" ? 1 : 0;
      const bAny = b.contextType === "any" ? 1 : 0;
      if (aAny !== bAny) return aAny - bAny;
      return a.priority - b.priority;
    })
    .map((r) => ({ ...r, place: places.get(r.placeId)! }));

  // One card per place so the list reads as a plan, not repetition.
  const seen = new Set<string>();
  const deduped: RankedRecommendation[] = [];
  for (const r of ranked) {
    if (seen.has(r.placeId)) continue;
    seen.add(r.placeId);
    deduped.push(r);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

export function getRecommendationsForPlaceIds(placeIds: string[]): RankedRecommendation[] {
  const places = new Map(getPlacesSync().map((p) => [p.id, p]));
  return recommendationsStore
    .getAll()
    .filter((r) => r.isActive && placeIds.includes(r.placeId))
    .sort((a, b) => a.priority - b.priority)
    .flatMap((r) => (places.has(r.placeId) ? [{ ...r, place: places.get(r.placeId)! }] : []));
}
