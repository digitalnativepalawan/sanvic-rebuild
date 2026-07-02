import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TimeOfDay } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "5 min from Poblacion" / "1 h 20 min from Poblacion" — never bare "5m". */
export function formatTravelTime(minutes?: number, travelNote?: string): string {
  if (minutes === undefined) return travelNote ?? "";
  if (minutes === 0) return "Town center";
  if (minutes < 60) return `${minutes} min from Poblacion`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h from Poblacion` : `${h} h ${m} min from Poblacion`;
}

export function getTimeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h < 11) return "morning";
  if (h < 15) return "midday";
  if (h < 17) return "afternoon";
  if (h < 19) return "sunset";
  return "evening";
}

export function timeOfDayGreeting(t: TimeOfDay): string {
  switch (t) {
    case "morning":
      return "Good morning";
    case "midday":
      return "Good day";
    case "afternoon":
      return "Good afternoon";
    case "sunset":
      return "Golden hour";
    case "evening":
      return "Good evening";
  }
}

/** Distance between two coordinates in km (haversine). */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}
