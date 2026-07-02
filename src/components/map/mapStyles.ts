// Centralized tile-layer configuration for the three map modes. All layers
// are keyless public tile services: Carto dark matter for the navy brand
// mode, OSM for street, Esri World Imagery for satellite.

export type MapStyleId = "navy" | "street" | "satellite";

export interface MapStyleConfig {
  id: MapStyleId;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const MAP_STYLES: Record<MapStyleId, MapStyleConfig> = {
  navy: {
    id: "navy",
    label: "Navy",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
  street: {
    id: "street",
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Imagery &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 18,
  },
};

const STYLE_STORAGE_KEY = "sanvic.mapStyle";
const BARANGAYS_STORAGE_KEY = "sanvic.mapLayers.barangays";

export function loadMapStyle(): MapStyleId {
  try {
    const stored = localStorage.getItem(STYLE_STORAGE_KEY);
    if (stored === "navy" || stored === "street" || stored === "satellite") return stored;
  } catch {
    // storage unavailable — fall through to default
  }
  return "navy";
}

export function saveMapStyle(style: MapStyleId): void {
  try {
    localStorage.setItem(STYLE_STORAGE_KEY, style);
  } catch {
    // best-effort persistence only
  }
}

/** Barangay Lines overlay visibility — defaults to on. */
export function loadBarangaysVisible(): boolean {
  try {
    return localStorage.getItem(BARANGAYS_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function saveBarangaysVisible(visible: boolean): void {
  try {
    localStorage.setItem(BARANGAYS_STORAGE_KEY, visible ? "on" : "off");
  } catch {
    // best-effort persistence only
  }
}
