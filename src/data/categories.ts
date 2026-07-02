import type { PlaceCategory } from "@/types";
import {
  Umbrella,
  Sailboat,
  UtensilsCrossed,
  BedDouble,
  TreePalm,
  Landmark,
  Laptop,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  id: PlaceCategory;
  label: string;
  /** Pin + chip color. Meaningful, not decorative: one hue per category. */
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "beaches", label: "Beaches", color: "#38bdf8", icon: Umbrella },
  { id: "islands", label: "Islands", color: "#a78bfa", icon: Sailboat },
  { id: "food", label: "Food", color: "#fb923c", icon: UtensilsCrossed },
  { id: "stays", label: "Stays", color: "#f472b6", icon: BedDouble },
  { id: "nature", label: "Nature", color: "#4ade80", icon: TreePalm },
  { id: "culture", label: "Culture", color: "#facc15", icon: Landmark },
  { id: "work", label: "Work spots", color: "#2dd4bf", icon: Laptop },
  { id: "events", label: "Events", color: "#f87171", icon: CalendarDays },
];

export const categoryMeta = (id: PlaceCategory): CategoryMeta =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
