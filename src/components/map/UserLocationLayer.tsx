import { useEffect, useRef, useSyncExternalStore } from "react";
import { Circle, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import {
  getLocationState,
  subscribeLocation,
} from "@/services/locationService";

// Renders the user's position (from the Locate button) as a pulsing aqua dot
// with an accuracy circle, and flies to it when a new fix arrives. If the fix
// is outside the Palawan region the map stays put (maxBounds would fight the
// pan) — the status chip in ExploreMap explains instead.

const userIcon = L.divIcon({
  className: "",
  html: `<div class="sanvic-user-marker"><span></span></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function UserLocationLayer() {
  const map = useMap();
  const state = useSyncExternalStore(subscribeLocation, getLocationState);
  const flownAt = useRef(0);

  useEffect(() => {
    const loc = state.location;
    if (state.status !== "ok" || !loc) return;
    if (loc.timestamp === flownAt.current) return;
    flownAt.current = loc.timestamp;
    if (!loc.insidePalawan) return;
    map.flyTo([loc.latitude, loc.longitude], Math.max(map.getZoom(), 14), { duration: 0.9 });
  }, [state, map]);

  const loc = state.location;
  if (!loc || !loc.insidePalawan) return null;

  return (
    <>
      {loc.accuracy > 0 && loc.accuracy < 2000 && (
        <Circle
          center={[loc.latitude, loc.longitude]}
          radius={loc.accuracy}
          pathOptions={{
            color: "#22d3ee",
            weight: 1,
            opacity: 0.35,
            fillColor: "#22d3ee",
            fillOpacity: 0.08,
          }}
        />
      )}
      <Marker position={[loc.latitude, loc.longitude]} icon={userIcon} zIndexOffset={500}>
        <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
          You are here
        </Tooltip>
      </Marker>
    </>
  );
}
