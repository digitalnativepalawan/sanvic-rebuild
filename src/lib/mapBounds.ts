import type { Position } from "geojson";
import type { Place } from "@/types";
import { BARANGAY_BOUNDARIES } from "@/data/barangayBoundaries";

// Map bounds derived from real data — the barangay boundary GeoJSON is the
// source of truth for where San Vicente is, not hardcoded coordinates.
//
// Coordinate order audit: GeoJSON stores positions as [longitude, latitude];
// Leaflet wants [latitude, longitude]. Everything in this module returns
// Leaflet order ([lat, lng]) and the flip happens in exactly one place
// (extendWithPosition) so it can't be done inconsistently.

export type LatLngTuple = [number, number];
export type BoundsTuple = [LatLngTuple, LatLngTuple]; // [[south, west], [north, east]]

// Sanity window for "is this coordinate plausibly in the Palawan region?".
// Anything outside is treated as bad data and excluded from bounds math so a
// single typo'd marker can't zoom the map out to the whole Philippines.
const PALAWAN_SANITY = { minLat: 8.0, maxLat: 12.5, minLng: 116.5, maxLng: 121.0 };

export function isValidPalawanCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= PALAWAN_SANITY.minLat &&
    lat <= PALAWAN_SANITY.maxLat &&
    lng >= PALAWAN_SANITY.minLng &&
    lng <= PALAWAN_SANITY.maxLng
  );
}

/** Places whose coordinates pass the Palawan sanity window. */
export function getValidPlaceCoordinates(places: Place[]): LatLngTuple[] {
  return places
    .filter((p) => isValidPalawanCoordinate(p.latitude, p.longitude))
    .map((p) => [p.latitude, p.longitude] as LatLngTuple);
}

class BoundsAccumulator {
  minLat = Infinity;
  maxLat = -Infinity;
  minLng = Infinity;
  maxLng = -Infinity;

  extendWithPosition(pos: Position) {
    // GeoJSON position: [lng, lat]
    const [lng, lat] = pos;
    if (!isValidPalawanCoordinate(lat, lng)) return;
    if (lat < this.minLat) this.minLat = lat;
    if (lat > this.maxLat) this.maxLat = lat;
    if (lng < this.minLng) this.minLng = lng;
    if (lng > this.maxLng) this.maxLng = lng;
  }

  extendWithLatLng([lat, lng]: LatLngTuple) {
    this.extendWithPosition([lng, lat]);
  }

  isEmpty(): boolean {
    return this.minLat > this.maxLat;
  }

  toBounds(padDeg = 0): BoundsTuple {
    return [
      [this.minLat - padDeg, this.minLng - padDeg],
      [this.maxLat + padDeg, this.maxLng + padDeg],
    ];
  }
}

function boundaryAccumulator(): BoundsAccumulator {
  const acc = new BoundsAccumulator();
  for (const feature of BARANGAY_BOUNDARIES.features) {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates) for (const pos of ring) acc.extendWithPosition(pos);
    } else {
      for (const poly of geom.coordinates)
        for (const ring of poly)
          for (const pos of ring) acc.extendWithPosition(pos);
    }
  }
  return acc;
}

// Last-resort fallback only if all real data fails: San Vicente town area.
// Never country-level.
const FALLBACK_SAN_VICENTE: BoundsTuple = [
  [10.25, 119.0],
  [10.8, 119.45],
];

/** Bounds of the ten barangay boundary polygons (real PSA geometry). */
export function getBarangayBounds(): BoundsTuple {
  const acc = boundaryAccumulator();
  return acc.isEmpty() ? FALLBACK_SAN_VICENTE : acc.toBounds();
}

/**
 * The municipality view: barangay boundaries extended by valid place
 * coordinates (offshore island destinations sit west of the polygons), with
 * a small breathing-room pad. This is what the map fits on first load.
 */
export function getSanVicenteBounds(places: Place[] = []): BoundsTuple {
  const acc = boundaryAccumulator();
  for (const coord of getValidPlaceCoordinates(places)) acc.extendWithLatLng(coord);
  return acc.isEmpty() ? FALLBACK_SAN_VICENTE : acc.toBounds(0.02);
}

/**
 * Hard pan limit: the San Vicente data bounds padded out to roughly the
 * Palawan region (~0.9° ≈ 100 km in every direction). Derived from the same
 * real data so it stays correct if geometry changes; the user can explore
 * around Palawan but can't drag off to Manila or open ocean.
 */
export function getPalawanMaxBounds(): BoundsTuple {
  const acc = boundaryAccumulator();
  if (acc.isEmpty()) return [[8.0, 116.5], [12.5, 121.0]];
  return acc.toBounds(0.9);
}

/** Center of the barangay geometry — used where a single point is needed. */
export function getSanVicenteCenter(): LatLngTuple {
  const [[s, w], [n, e]] = getBarangayBounds();
  return [(s + n) / 2, (w + e) / 2];
}
