import { useSyncExternalStore } from "react";
import * as tripService from "@/services/tripService";

export function useTripItems() {
  return useSyncExternalStore(tripService.subscribe, tripService.getTripItems);
}

export function useIsSaved(placeId: string): boolean {
  return useSyncExternalStore(tripService.subscribe, () => tripService.isSaved(placeId));
}
