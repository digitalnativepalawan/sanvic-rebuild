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
import { MAP_STYLES, loadMapStyle, saveMapStyle, type MapStyleId } from "./mapStyles";

// The SANVIC map: category-coded place pins over the barangay boundary
// layer, with Poblacion as the fixed reference point every travel time is
// measured from. The viewport is driven by real data: first load fits the
// barangay boundary GeoJSON (+ valid place coordinates), and panning is
// hard-limited to the Palawan region.

function pinIcon(place: Place, active: boolean): L.DivIcon {
  const meta = categoryMeta(place.category);
  const iconSvg = renderToStaticMarkup(
    <meta.icon size={active ? 15 : 11} color="#fff" strokeWidth={2.5} />,
  );
  const size = active ? 34 : 22;
  return L.divIcon({
    className: "",
    html: `<div class="sanvic-pin ${active ? "sanvic-pin--active" : ""}" style="background:${meta.color}">${iconSvg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
  });
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
  const [layers, setLayers] = useState<MapLayers>({ barangays: true });
  const [mapStyle, setMapStyle] = useState<MapStyleId>(loadMapStyle);

  const handleStyleChange = (style: MapStyleId) => {
    setMapStyle(style);
    saveMapStyle(style);
  };

  // Viewport from real data: fit the municipality on load, never pan beyond
  // the Palawan region. Computed once — geometry is static per session.
  const initialBounds = useMemo(() => getSanVicenteBounds(places), [places]);
  const maxBounds = useMemo(() => getPalawanMaxBounds(), []);

  const markers = useMemo(
    () =>
      places.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitude, p.longitude]}
          icon={pinIcon(p, selected?.id === p.id)}
          eventHandlers={{ click: () => onSelect(p) }}
        />
      )),
    [places, selected, onSelect],
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
        <FlyTo place={selected} />
        <InvalidateOnResize />
      </MapContainer>
      <MapLayerControls
        layers={layers}
        onChange={setLayers}
        mapStyle={mapStyle}
        onStyleChange={handleStyleChange}
        className="absolute right-3 top-16 z-[1000] md:top-3"
      />
    </div>
  );
}
