import { useEffect, useState, useSyncExternalStore } from "react";
import { LoaderCircle, LocateOff, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocationState, subscribeLocation } from "@/services/locationService";

// Transient feedback for the Locate button: "locating", permission denied,
// or "you're outside the San Vicente map area". Successful in-area fixes
// need no chip — the map flies to the pulsing dot.

export function LocationStatusChip({ className }: { className?: string }) {
  const state = useSyncExternalStore(subscribeLocation, getLocationState);
  const [dismissed, setDismissed] = useState(false);

  // Show fresh feedback on every new request; auto-dismiss terminal
  // messages after a few seconds.
  useEffect(() => {
    if (state.status === "locating") {
      setDismissed(false);
      return;
    }
    const t = setTimeout(() => setDismissed(true), 5000);
    return () => clearTimeout(t);
  }, [state]);

  let content: { icon: typeof LoaderCircle; text: string; spin?: boolean } | undefined;
  if (state.status === "locating") {
    content = { icon: LoaderCircle, text: "Finding you…", spin: true };
  } else if (state.status === "denied") {
    content = { icon: LocateOff, text: "Location permission denied" };
  } else if (state.status === "error" || state.status === "unsupported") {
    content = { icon: LocateOff, text: "Couldn't get your location" };
  } else if (state.status === "ok" && state.location && !state.location.insidePalawan) {
    content = { icon: MapPinOff, text: "You're outside the San Vicente map area" };
  }

  if (!content) return null;
  if (state.status !== "locating" && dismissed) return null;

  const Icon = content.icon;
  return (
    <div className={cn("pointer-events-none", className)}>
      <span className="chip glass text-mist-200">
        <Icon size={13} className={cn("text-tide-300", content.spin && "animate-spin")} />
        {content.text}
      </span>
    </div>
  );
}
