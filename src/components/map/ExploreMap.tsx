import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { Place } from "@/types";
import { categoryMeta } from "@/data/categories";
import { POBLACION } from "@/data/places";
import { BarangayBoundaryLayer } from "./BarangayBoundaryLayer";
import { MapLayerControls, type MapLayers } from "./MapLayerControls";

// The SANVIC map: category-coded place pins over the barangay boundary
// layer, with Poblacion as the fixed reference point every travel time is
// measured from. Pins are colored teardrops with the category icon inside,
// matching the legend chips — pins mean something.

const SAN_VICENTE_CENTER: [number, number] = [10.48, 119.2];

function pinIcon(place: Place, active: boolean): L.DivIcon {
  const meta = categoryMeta(place.category);
  const iconSvg = renderToStaticMarkup(<meta.icon size={14} color="#fff" strokeWidth={2.5} />);
  return L.divIcon({
    className: "",
    html: `<div class="sanvic-pin ${active ? "sanvic-pin--active" : ""}" style="background:${meta.color}">${iconSvg}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

const poblacionIcon = L.divIcon({
  className: "",
  html: `<div class="sanvic-reference-marker">✦</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
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
        map.setView(target, 13, { animate: false });
      } else {
        map.flyTo(target, 13, { duration: 0.8 });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [place, map]);
  return null;
}

export function ExploreMap({
  places,
  selected,
  onSelect,
}: {
  places: Place[];
  selected?: Place;
  onSelect: (place: Place) => void;
}) {
  const [layers, setLayers] = useState<MapLayers>({ barangays: true });

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

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={SAN_VICENTE_CENTER}
        zoom={11}
        minZoom={9}
        maxZoom={17}
        zoomControl={false}
        className="h-full w-full"
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {layers.barangays && <BarangayBoundaryLayer />}
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
      </MapContainer>
      <MapLayerControls
        layers={layers}
        onChange={setLayers}
        className="absolute right-3 top-16 z-[1000] md:top-3"
      />
    </div>
  );
}
