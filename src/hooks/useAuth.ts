import { useSyncExternalStore } from "react";
import { getAuthState, subscribeAuth, type AuthState } from "@/services/authService";

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribeAuth, getAuthState);
}
