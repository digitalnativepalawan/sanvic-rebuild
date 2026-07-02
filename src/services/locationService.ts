import { isValidPalawanCoordinate } from "@/lib/mapBounds";

// User geolocation for the Locate button. Small pub/sub store so the nav
// button (AppShell) and the map layer stay decoupled: the button requests a
// fix, the map subscribes and reacts.

export interface UserLocation {
  latitude: number;
  longitude: number;
  /** Accuracy radius in meters, as reported by the browser. */
  accuracy: number;
  /** True when the fix is inside the Palawan map region. */
  insidePalawan: boolean;
  timestamp: number;
}

export type LocationStatus = "idle" | "locating" | "ok" | "denied" | "error" | "unsupported";

export interface LocationState {
  status: LocationStatus;
  location?: UserLocation;
}

let state: LocationState = { status: "idle" };
const listeners = new Set<() => void>();

function setState(next: LocationState) {
  state = next;
  listeners.forEach((l) => l());
}

export function getLocationState(): LocationState {
  return state;
}

export function subscribeLocation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Ask the browser for a position fix and publish the result. */
export function requestLocation(): void {
  if (!("geolocation" in navigator)) {
    setState({ status: "unsupported" });
    return;
  }
  setState({ status: "locating", location: state.location });
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setState({
        status: "ok",
        location: {
          latitude,
          longitude,
          accuracy,
          insidePalawan: isValidPalawanCoordinate(latitude, longitude),
          timestamp: Date.now(),
        },
      });
    },
    (err) => {
      setState({
        status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
        location: state.location,
      });
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
  );
}
