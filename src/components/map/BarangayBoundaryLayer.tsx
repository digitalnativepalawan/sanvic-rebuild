import { useEffect, useMemo, useState } from "react";
import { GeoJSON, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { getBarangaysSync, getBoundaryFeatures } from "@/services/barangayService";
import { barangaysStore } from "@/services/barangayService";
import type { MapStyleId } from "./mapStyles";

// Barangay boundary lines + labels. The communities are a core layer of the
// product, not decoration: thin dashed lines with quiet uppercase labels, so
// the municipality reads as ten distinct places. Line treatment adapts per
// map mode so boundaries stay readable over navy, street, and satellite.

const BOUNDARY_STYLES: Record<MapStyleId, L.PathOptions> = {
  navy: {
    color: "#67e8f9",
    weight: 1.1,
    opacity: 0.5,
    dashArray: "5 5",
    fillColor: "#0e2440",
    fillOpacity: 0.06,
  },
  street: {
    color: "#0891b2",
    weight: 1.4,
    opacity: 0.65,
    dashArray: "5 5",
    fillColor: "#06b6d4",
    fillOpacity: 0.04,
  },
  satellite: {
    color: "#a5f3fc",
    weight: 1.4,
    opacity: 0.75,
    dashArray: "5 5",
    fillColor: "#0e2440",
    fillOpacity: 0.05,
  },
};

function labelIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span class="sanvic-brgy-label">${name}</span>`,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

export function BarangayBoundaryLayer({
  showLabels = true,
  mapStyle = "navy",
}: {
  showLabels?: boolean;
  mapStyle?: MapStyleId;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [, setVersion] = useState(0);

  // Re-render when admin edits barangays (label visibility, active, names).
  useEffect(() => barangaysStore.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map]);

  const features = getBoundaryFeatures();
  const barangays = getBarangaysSync();

  // GeoJSON is immutable in react-leaflet; key on content so admin
  // activation/deactivation replaces the layer.
  const geoKey = useMemo(() => features.map((f) => f.properties.name).join("|"), [features]);

  // Labels: keep the overview readable — below zoom 10 the labels would
  // collide on small screens, so only barangays flagged visible show, and
  // everything hides below zoom 9.
  const labelsVisible = showLabels && zoom >= 9;

  return (
    <>
      <GeoJSON
        key={`${geoKey}:${mapStyle}`}
        data={{ type: "FeatureCollection", features } as never}
        style={BOUNDARY_STYLES[mapStyle]}
      />
      {labelsVisible &&
        barangays
          .filter((b) => b.labelVisible || zoom >= 11)
          .map((b) => (
            <Marker
              key={b.id}
              position={[b.latitude, b.longitude]}
              icon={labelIcon(b.name)}
              interactive={false}
            />
          ))}
    </>
  );
}
