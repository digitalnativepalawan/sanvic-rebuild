import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { Barangay } from "@/types";
import { BARANGAYS } from "@/data/seedBarangays";
import {
  BARANGAY_BOUNDARIES,
  type BarangayFeatureProps,
} from "@/data/barangayBoundaries";
import { createContentStore } from "@/services/contentService";

// Barangay data access. Editable metadata (names, descriptions, label
// visibility, order) lives in the barangaysStore; boundary geometry ships as
// static PSA-derived GeoJSON for now, with the `barangay_boundaries` table
// ready to replace it when higher-resolution polygons are onboarded.

function fromBarangayRow(row: Record<string, unknown>): Barangay {
  const r = row as Record<string, never>;
  return {
    id: r["id"],
    name: r["name"],
    slug: r["slug"],
    description: (r["description"] as string | null) ?? undefined,
    latitude: r["latitude"],
    longitude: r["longitude"],
    labelVisible: Boolean(r["label_visible"]),
    sortOrder: (r["sort_order"] as number) ?? 0,
    isActive: Boolean(r["is_active"]),
  };
}

function toBarangayRow(b: Barangay): Record<string, unknown> {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description ?? null,
    latitude: b.latitude,
    longitude: b.longitude,
    label_visible: b.labelVisible,
    sort_order: b.sortOrder,
    is_active: b.isActive,
  };
}

export const barangaysStore = createContentStore<Barangay>({
  storageKey: "sanvic.content.barangays",
  seed: BARANGAYS,
  remote: { table: "barangays", fromRow: fromBarangayRow, toRow: toBarangayRow },
});

export function getBarangaysSync(): Barangay[] {
  return barangaysStore
    .getAll()
    .filter((b) => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export type BarangayFeature = Feature<Polygon | MultiPolygon, BarangayFeatureProps>;

/** Boundary features for active barangays only (matched by display name). */
export function getBoundaryFeatures(): BarangayFeature[] {
  const activeNames = new Set(getBarangaysSync().map((b) => b.name));
  return BARANGAY_BOUNDARIES.features.filter((f) => activeNames.has(f.properties.name));
}
