import type { Place, PlaceCategory, LocalUpdate } from "@/types";
import { PLACES } from "@/data/places";
import { LOCAL_UPDATES } from "@/data/localUpdates";
import { supabase } from "@/lib/supabase";

// Data access layer for content. UI components never touch Supabase or seed
// arrays directly — they go through these functions, so wiring a live
// backend later changes nothing above this file.

type PlaceRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  short_reason: string;
  latitude: number;
  longitude: number;
  barangay: string;
  address: string | null;
  image_url: string | null;
  gallery: string[] | null;
  rating: number | null;
  price_level: number | null;
  best_time: string | null;
  best_season: string | null;
  travel_minutes_from_poblacion: number | null;
  travel_note: string | null;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
};

function mapPlaceRow(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category as PlaceCategory,
    description: row.description,
    shortReason: row.short_reason,
    latitude: row.latitude,
    longitude: row.longitude,
    barangay: row.barangay,
    address: row.address ?? undefined,
    imageUrl: row.image_url ?? undefined,
    gallery: row.gallery ?? undefined,
    rating: row.rating ?? undefined,
    priceLevel: (row.price_level ?? undefined) as Place["priceLevel"],
    bestTime: row.best_time ?? undefined,
    bestSeason: row.best_season ?? undefined,
    travelMinutesFromPoblacion: row.travel_minutes_from_poblacion ?? undefined,
    travelNote: row.travel_note ?? undefined,
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    isActive: row.is_active,
  };
}

export async function getPlaces(): Promise<Place[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (!error && data && data.length > 0) return (data as PlaceRow[]).map(mapPlaceRow);
  }
  return PLACES.filter((p) => p.isActive);
}

export function getPlacesSync(): Place[] {
  return PLACES.filter((p) => p.isActive);
}

export async function getPlaceBySlug(slug: string): Promise<Place | undefined> {
  const places = await getPlaces();
  return places.find((p) => p.slug === slug);
}

export function filterByCategory(places: Place[], category: PlaceCategory | "all"): Place[] {
  return category === "all" ? places : places.filter((p) => p.category === category);
}

export async function getLocalUpdates(): Promise<LocalUpdate[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("local_updates")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        category: row.category as LocalUpdate["category"],
        location: row.location ?? undefined,
        severity: row.severity as LocalUpdate["severity"],
        source: row.source,
        imageUrl: row.image_url ?? undefined,
        validFrom: row.valid_from ?? undefined,
        validUntil: row.valid_until ?? undefined,
        createdAt: row.created_at,
      }));
    }
  }
  return LOCAL_UPDATES;
}
