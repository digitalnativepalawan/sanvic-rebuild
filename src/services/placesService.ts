import type { LocalUpdate, Place, PlaceCategory } from "@/types";
import { PLACES } from "@/data/places";
import { LOCAL_UPDATES } from "@/data/localUpdates";
import { createContentStore } from "@/services/contentService";

// Data access layer for places and local updates. UI components never touch
// Supabase or seed arrays directly — everything goes through the content
// stores, which handle seed fallback, localStorage drafts (admin edits), and
// Supabase hydration/write-through when configured.

function fromPlaceRow(row: Record<string, unknown>): Place {
  const r = row as Record<string, never>;
  return {
    id: r["id"],
    name: r["name"],
    slug: r["slug"],
    category: r["category"] as PlaceCategory,
    description: (r["description"] as string) ?? "",
    shortReason: (r["short_reason"] as string) ?? "",
    latitude: r["latitude"],
    longitude: r["longitude"],
    barangay: (r["barangay"] as string) ?? "",
    address: (r["address"] as string | null) ?? undefined,
    imageUrl: (r["image_url"] as string | null) ?? undefined,
    gallery: (r["gallery"] as string[] | null) ?? undefined,
    rating: (r["rating"] as number | null) ?? undefined,
    priceLevel: ((r["price_level"] as number | null) ?? undefined) as Place["priceLevel"],
    bestTime: (r["best_time"] as string | null) ?? undefined,
    bestSeason: (r["best_season"] as string | null) ?? undefined,
    travelMinutesFromPoblacion:
      (r["travel_minutes_from_poblacion"] as number | null) ?? undefined,
    travelNote: (r["travel_note"] as string | null) ?? undefined,
    bookingUrl: (r["booking_url"] as string | null) ?? undefined,
    tags: (r["tags"] as string[] | null) ?? [],
    isFeatured: Boolean(r["is_featured"]),
    isActive: Boolean(r["is_active"]),
  };
}

function toPlaceRow(p: Place): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    description: p.description,
    short_reason: p.shortReason,
    latitude: p.latitude,
    longitude: p.longitude,
    barangay: p.barangay,
    address: p.address ?? null,
    image_url: p.imageUrl ?? null,
    gallery: p.gallery ?? null,
    rating: p.rating ?? null,
    price_level: p.priceLevel ?? null,
    best_time: p.bestTime ?? null,
    best_season: p.bestSeason ?? null,
    travel_minutes_from_poblacion: p.travelMinutesFromPoblacion ?? null,
    travel_note: p.travelNote ?? null,
    booking_url: p.bookingUrl ?? null,
    tags: p.tags,
    is_featured: p.isFeatured,
    is_active: p.isActive,
  };
}

export const placesStore = createContentStore<Place>({
  storageKey: "sanvic.content.places",
  seed: PLACES,
  remote: { table: "places", fromRow: fromPlaceRow, toRow: toPlaceRow },
});

function fromUpdateRow(row: Record<string, unknown>): LocalUpdate {
  const r = row as Record<string, never>;
  return {
    id: r["id"],
    title: r["title"],
    body: r["body"],
    category: r["category"] as LocalUpdate["category"],
    location: (r["location"] as string | null) ?? undefined,
    severity: r["severity"] as LocalUpdate["severity"],
    source: (r["source"] as string) ?? "SANVIC",
    imageUrl: (r["image_url"] as string | null) ?? undefined,
    validFrom: (r["valid_from"] as string | null) ?? undefined,
    validUntil: (r["valid_until"] as string | null) ?? undefined,
    isActive: (r["is_active"] as boolean | null) ?? true,
    createdAt: r["created_at"],
  };
}

function toUpdateRow(u: LocalUpdate): Record<string, unknown> {
  return {
    id: u.id,
    title: u.title,
    body: u.body,
    category: u.category,
    location: u.location ?? null,
    severity: u.severity,
    source: u.source,
    image_url: u.imageUrl ?? null,
    valid_from: u.validFrom ?? null,
    valid_until: u.validUntil ?? null,
    is_active: u.isActive,
    created_at: u.createdAt,
  };
}

export const updatesStore = createContentStore<LocalUpdate>({
  storageKey: "sanvic.content.local_updates",
  seed: LOCAL_UPDATES,
  remote: { table: "local_updates", fromRow: fromUpdateRow, toRow: toUpdateRow },
});

// ── read API used by the app ─────────────────────────────────

export async function getPlaces(): Promise<Place[]> {
  await placesStore.ready;
  return getPlacesSync();
}

export function getPlacesSync(): Place[] {
  return placesStore.getAll().filter((p) => p.isActive);
}

export async function getPlaceBySlug(slug: string): Promise<Place | undefined> {
  const places = await getPlaces();
  return places.find((p) => p.slug === slug);
}

export function filterByCategory(places: Place[], category: PlaceCategory | "all"): Place[] {
  return category === "all" ? places : places.filter((p) => p.category === category);
}

export async function getLocalUpdates(): Promise<LocalUpdate[]> {
  await updatesStore.ready;
  const now = Date.now();
  return updatesStore
    .getAll()
    .filter(
      (u) =>
        u.isActive &&
        (!u.validFrom || new Date(u.validFrom).getTime() <= now) &&
        (!u.validUntil || new Date(u.validUntil).getTime() >= now),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
