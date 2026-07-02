import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsSaved } from "@/hooks/useTrip";
import { toggleSaved } from "@/services/tripService";

export function SaveButton({
  placeId,
  withLabel = false,
  className,
}: {
  placeId: string;
  withLabel?: boolean;
  className?: string;
}) {
  const saved = useIsSaved(placeId);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(placeId);
      }}
      aria-label={saved ? "Remove from trip" : "Save to trip"}
      aria-pressed={saved}
      className={cn(
        "chip border",
        saved
          ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
          : "border-white/10 bg-white/5 text-mist-300 hover:bg-white/10 hover:text-mist-100",
        className,
      )}
    >
      <Heart size={14} className={saved ? "fill-current" : undefined} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
}
