import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

// Floating layer toggles over the map. Kept deliberately small: one chip per
// optional layer, matching the app's chip language.

export interface MapLayers {
  barangays: boolean;
}

export function MapLayerControls({
  layers,
  onChange,
  className,
}: {
  layers: MapLayers;
  onChange: (layers: MapLayers) => void;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-auto flex flex-col items-end gap-2", className)}>
      <button
        onClick={() => onChange({ ...layers, barangays: !layers.barangays })}
        aria-pressed={layers.barangays}
        className={cn(
          "chip glass border",
          layers.barangays
            ? "border-tide-400/40 text-tide-300"
            : "border-white/10 text-mist-400",
        )}
      >
        <Hexagon size={13} />
        Barangays
      </button>
    </div>
  );
}
