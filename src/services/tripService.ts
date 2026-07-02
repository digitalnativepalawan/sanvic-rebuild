import type { TripDay, TripItem } from "@/types";
import { getSessionId } from "@/lib/session";

// Trip persistence. Local-first: items live in localStorage keyed by the
// anonymous session id, matching the shape of the `trip_items` table so a
// Supabase sync can replace the storage layer without UI changes.
// A tiny pub/sub keeps every mounted component in step (the useTrip hook
// subscribes here).

const storageKey = () => `sanvic.trip.${getSessionId()}`;

type Listener = () => void;
const listeners = new Set<Listener>();
let cached: TripItem[] | null = null;

function load(): TripItem[] {
  if (cached) return cached;
  try {
    cached = JSON.parse(localStorage.getItem(storageKey()) ?? "[]") as TripItem[];
  } catch {
    cached = [];
  }
  return cached;
}

function persist(items: TripItem[]) {
  cached = items;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode) — state stays in memory for the session.
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTripItems(): TripItem[] {
  return load();
}

export function isSaved(placeId: string): boolean {
  return load().some((i) => i.placeId === placeId);
}

export function savePlace(placeId: string, day: TripDay = "later"): void {
  const items = load();
  if (items.some((i) => i.placeId === placeId)) return;
  persist([
    ...items,
    {
      id: crypto.randomUUID(),
      placeId,
      day,
      sortOrder: items.filter((i) => i.day === day).length,
      createdAt: new Date().toISOString(),
    },
  ]);
}

export function removePlace(placeId: string): void {
  persist(load().filter((i) => i.placeId !== placeId));
}

export function toggleSaved(placeId: string): boolean {
  if (isSaved(placeId)) {
    removePlace(placeId);
    return false;
  }
  savePlace(placeId);
  return true;
}

export function moveToDay(itemId: string, day: TripDay): void {
  const items = load();
  persist(
    items.map((i) =>
      i.id === itemId
        ? { ...i, day, sortOrder: items.filter((x) => x.day === day).length }
        : i,
    ),
  );
}

export function reorder(itemId: string, direction: -1 | 1): void {
  const items = load();
  const item = items.find((i) => i.id === itemId);
  if (!item) return;
  const dayItems = items
    .filter((i) => i.day === item.day)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = dayItems.findIndex((i) => i.id === itemId);
  const swapWith = dayItems[idx + direction];
  if (!swapWith) return;
  persist(
    items.map((i) => {
      if (i.id === item.id) return { ...i, sortOrder: swapWith.sortOrder };
      if (i.id === swapWith.id) return { ...i, sortOrder: item.sortOrder };
      return i;
    }),
  );
}

export function setNote(itemId: string, note: string): void {
  persist(load().map((i) => (i.id === itemId ? { ...i, note: note || undefined } : i)));
}
