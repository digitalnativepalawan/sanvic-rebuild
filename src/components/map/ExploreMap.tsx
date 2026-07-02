import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { Place } from "@/types";
import { categoryMeta } from "@/data/categories";
import { POBLACION } from "@/data/places";
import { getSanVicenteBounds, getPalawanMaxBounds } from "@/lib/mapBounds";
import { BarangayBoundaryLayer } from "./BarangayBoundaryLayer";
import { MapLayerControls, type MapLayers } from "./MapLayerControls";
import {
  MAP_STYLES,
  loadBarangaysVisible,
  loadMapStyle,
  saveBarangaysVisible,
  saveMapStyle,
  type MapStyleId,
} from "./mapStyles";
import { UserLocationLayer } from "./UserLocationLayer";
import { LocationStatusChip } from "./LocationStatusChip";

// The SANVIC map: category-coded place pins over the barangay boundary
// layer, with Poblacion as the fixed reference point every travel time is
// measured from. The viewport is driven by real data: first load fits the
// barangay boundary GeoJSON (+ valid place coordinates), and panning is
// hard-limited to the Palawan region.
//
// Progressive disclosure keeps the overview beautiful instead of clustered,
// but every marker is always the same shape — a small teardrop with its
// category's Lucide icon inside. Only the size steps down at low zoom
// (smaller still for non-featured places); nothing ever switches to a
// plain dot, so the map never mixes two marker languages at once.

type MarkerTier = "far" | "mid" | "near";

function tierForZoom(zoom: number): MarkerTier {
  if (zoom >= 13) return "near";
  if (zoom >= 11) return "mid";
  return "far";
}

const TIER_SIZE: Record<MarkerTier, { featured: number; normal: number }> = {
  near: { featured: 24, normal: 22 },
  mid: { featured: 20, normal: 17 },
  far: { featured: 16, normal: 14 },
};

function teardropIcon(place: Place, size: number, active: boolean): L.DivIcon {
  const meta = categoryMeta(place.category);
  const iconPx = active ? 15 : Math.max(8, Math.round(size * 0.45));
  const iconSvg = renderToStaticMarkup(
    <meta.icon size={iconPx} color="#fff" strokeWidth={2.5} />,
  );
  return L.divIcon({
    className: "",
    html: `<div class="sanvic-pin ${active ? "sanvic-pin--active" : ""}" style="width:${size}px;height:${size}px;background:${meta.color}">${iconSvg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
  });
}

function placeIcon(place: Place, active: boolean, tier: MarkerTier): L.DivIcon {
  if (active) return teardropIcon(place, 34, true);
  const size = place.isFeatured ? TIER_SIZE[tier].featured : TIER_SIZE[tier].normal;
  return teardropIcon(place, size, false);
}

// Publishes the current zoom so markers can re-tier on zoomend.
function ZoomTracker({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onZoom(map.getZoom());
    handler();
    map.on("zoomend", handler);
    return () => {
      map.off("zoomend", handler);
    };
  }, [map, onZoom]);
  return null;
}

const poblacionIcon = L.divIcon({
  className: "",
  html: `<div class="sanvic-reference-marker">✦</div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FlyTo({ place }: { place?: Place }) {
  const map = useMap();
  useEffect(() => {
    if (!place) return;
    const target: [number, number] = [place.latitude, place.longitude];
    // On first mount the container can still be 0-sized (layout not done),
    // which makes animated flyTo produce NaN coordinates — measure first and
    // fall back to an instant setView.
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) {
        map.setView(target, 14, { animate: false });
      } else {
        map.flyTo(target, 14, { duration: 0.8 });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [place, map]);
  return null;
}

// Keep the Leaflet viewport in sync when the container resizes (bottom sheet
// opening, panel collapse, orientation change).
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export function ExploreMap({
  places,
  selected,
  onSelect,
  boundsOptions,
}: {
  places: Place[];
  selected?: Place;
  onSelect: (place: Place) => void;
  /** fitBounds padding so overlays (side panel, bottom sheet) don't cover the fitted area. */
  boundsOptions?: L.FitBoundsOptions;
}) {
  const [layers, setLayers] = useState<MapLayers>(() => ({
    barangays: loadBarangaysVisible(),
  }));
  const [mapStyle, setMapStyle] = useState<MapStyleId>(loadMapStyle);

  const handleStyleChange = (style: MapStyleId) => {
    setMapStyle(style);
    saveMapStyle(style);
  };

  const handleLayersChange = (next: MapLayers) => {
    setLayers(next);
    saveBarangaysVisible(next.barangays);
  };

  // Viewport from real data: fit the municipality on load, never pan beyond
  // the Palawan region. Computed once — geometry is static per session.
  const initialBounds = useMemo(() => getSanVicenteBounds(places), [places]);
  const maxBounds = useMemo(() => getPalawanMaxBounds(), []);

  const [zoom, setZoom] = useState(10);
  const tier = tierForZoom(zoom);

  const markers = useMemo(
    () =>
      places.map((p) => {
        const active = selected?.id === p.id;
        return (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={placeIcon(p, active, tier)}
            zIndexOffset={active ? 300 : p.isFeatured ? 100 : 0}
            eventHandlers={{ click: () => onSelect(p) }}
          >
            {!active && (
              <Tooltip direction="top" offset={[0, tier === "near" ? -20 : -8]} opacity={0.95}>
                {p.name}
              </Tooltip>
            )}
          </Marker>
        );
      }),
    [places, selected, onSelect, tier],
  );

  const tile = MAP_STYLES[mapStyle];

  return (
    <div className={`relative h-full w-full map-style-${mapStyle}`}>
      <MapContainer
        bounds={initialBounds}
        boundsOptions={boundsOptions}
        maxBounds={maxBounds}
        maxBoundsViscosity={0.9}
        minZoom={9}
        maxZoom={17}
        zoomControl={false}
        className="h-full w-full"
        attributionControl={true}
      >
        <TileLayer key={tile.id} attribution={tile.attribution} url={tile.url} maxZoom={tile.maxZoom} />
        {layers.barangays && <BarangayBoundaryLayer mapStyle={mapStyle} />}
        {/* Poblacion reference point — every travel time is measured from here */}
        <Marker
          position={[POBLACION.latitude, POBLACION.longitude]}
          icon={poblacionIcon}
          zIndexOffset={-100}
        >
          <Tooltip direction="bottom" offset={[0, 8]} opacity={0.9}>
            Poblacion — town center reference
          </Tooltip>
        </Marker>
        {markers}
        <UserLocationLayer />
        <ZoomTracker onZoom={setZoom} />
        <FlyTo place={selected} />
        <InvalidateOnResize />
      </MapContainer>
      <LocationStatusChip className="absolute left-1/2 top-16 z-[1000] -translate-x-1/2 md:top-3" />
      <MapLayerControls
        layers={layers}
        onChange={handleLayersChange}
        mapStyle={mapStyle}
        onStyleChange={handleStyleChange}
        className="absolute right-3 top-16 z-[1000] md:top-3"
      />
    </div>
  );
}
