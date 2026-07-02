import { useState } from "react";
import { Hexagon, Layers, Moon, Map as MapIcon, Satellite, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAP_STYLES, type MapStyleId } from "./mapStyles";

// Floating map controls: a small "Layers" button that expands into a glass
// panel with the three map modes (Navy / Street / Satellite) and the
// Barangays overlay toggle. Same compact control on desktop and mobile —
// never hidden on small screens.

export interface MapLayers {
  barangays: boolean;
}

const STYLE_ICONS: Record<MapStyleId, typeof Moon> = {
  navy: Moon,
  street: MapIcon,
  satellite: Satellite,
};

export function MapLayerControls({
  layers,
  onChange,
  mapStyle,
  onStyleChange,
  className,
}: {
  layers: MapLayers;
  onChange: (layers: MapLayers) => void;
  mapStyle: MapStyleId;
  onStyleChange: (style: MapStyleId) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("pointer-events-auto flex flex-col items-end gap-2", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Map layers"
        className={cn(
          "chip glass border",
          open ? "border-tide-400/40 text-tide-300" : "border-white/10 text-mist-300",
        )}
      >
        <Layers size={13} />
        Layers
      </button>

      {open && (
        <div className="glass animate-fade-up w-44 rounded-2xl p-1.5">
          <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500">
            Map mode
          </p>
          {(Object.keys(MAP_STYLES) as MapStyleId[]).map((id) => {
            const Icon = STYLE_ICONS[id];
            const active = mapStyle === id;
            return (
              <button
                key={id}
                onClick={() => onStyleChange(id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors",
                  active ? "bg-tide-500/15 text-tide-300" : "text-mist-300 hover:bg-white/5",
                )}
              >
                <Icon size={14} />
                {MAP_STYLES[id].label}
                {active && <Check size={13} className="ml-auto" />}
              </button>
            );
          })}
          <div className="mx-2 my-1 border-t border-white/[0.08]" />
          <button
            onClick={() => onChange({ ...layers, barangays: !layers.barangays })}
            aria-pressed={layers.barangays}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors",
              layers.barangays ? "text-tide-300" : "text-mist-400 hover:bg-white/5",
            )}
          >
            <Hexagon size={14} />
            Barangays
            {layers.barangays && <Check size={13} className="ml-auto" />}
          </button>
        </div>
      )}
    </div>
  );
}
