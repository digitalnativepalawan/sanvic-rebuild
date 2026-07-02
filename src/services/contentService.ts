import { supabase } from "@/lib/supabase";

// Editable content store — the backbone of /admin.
//
// Every editable collection (places, recommendations, local updates,
// barangays) is a ContentStore: an in-memory list seeded from src/data,
// persisted to localStorage, with a pub/sub for React (useSyncExternalStore).
//
// Persistence modes:
//   • No Supabase env  → edits persist to localStorage only ("Local draft").
//   • Supabase present → the store hydrates from the table on startup and
//     every admin write goes through to Supabase (upsert/delete) as well.
//     localStorage doubles as an offline cache.
//
// UI components and admin screens never talk to Supabase directly — they
// only call store methods, so the backend can change without UI rewrites.

type Listener = () => void;

export interface RemoteBinding<T> {
  table: string;
  fromRow: (row: Record<string, unknown>) => T;
  toRow: (item: T) => Record<string, unknown>;
}

export interface ContentStore<T extends { id: string }> {
  getAll: () => T[];
  subscribe: (listener: Listener) => () => void;
  /** Insert or replace by id. Returns a warning message if the remote write failed. */
  upsert: (item: T) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
  /** Discard local edits and return to the bundled seed content. */
  resetToSeed: () => void;
  /** True once localStorage differs from the seed (local drafts exist). */
  hasLocalEdits: () => boolean;
  /** Resolves when the initial Supabase hydration (if any) has settled. */
  ready: Promise<void>;
}

export function createContentStore<T extends { id: string }>(options: {
  storageKey: string;
  seed: T[];
  remote?: RemoteBinding<T>;
}): ContentStore<T> {
  const { storageKey, seed, remote } = options;
  const listeners = new Set<Listener>();
  let items: T[] = load();
  let edited = localStorage_get() !== null;

  function localStorage_get(): string | null {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  function load(): T[] {
    const raw = localStorage_get();
    if (raw) {
      try {
        return JSON.parse(raw) as T[];
      } catch {
        // fall through to seed
      }
    }
    return seed;
  }

  function persist(next: T[], markEdited = true) {
    items = next;
    if (markEdited) edited = true;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Private mode etc. — state stays in memory for the session.
    }
    listeners.forEach((l) => l());
  }

  // The typed client only knows the tables in Database, so dynamic table
  // access goes through this narrow escape hatch; the RemoteBinding mappers
  // are the real type boundary.
  interface RemoteTable {
    select(cols: string): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
    upsert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
    delete(): { eq(col: string, v: string): PromiseLike<{ error: { message: string } | null }> };
  }
  const remoteTable = (): RemoteTable =>
    (supabase as unknown as { from(t: string): RemoteTable }).from(remote!.table);

  // Hydrate from Supabase when configured; seed/local data remains the
  // fallback if the fetch fails, times out, or the table is empty. The
  // timeout matters as much as the try/catch: an unreachable or very slow
  // connection would otherwise leave the UI waiting on `ready` indefinitely
  // instead of showing content immediately.
  const HYDRATE_TIMEOUT_MS = 5000;
  const ready: Promise<void> = (async () => {
    if (!remote || !supabase) return;
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase hydration timed out")), HYDRATE_TIMEOUT_MS),
      );
      const { data, error } = await Promise.race([remoteTable().select("*"), timeout]);
      if (!error && data && data.length > 0) {
        persist(data.map((row) => remote.fromRow(row as Record<string, unknown>)), false);
      }
    } catch {
      // Offline, misconfigured, or too slow — keep local content.
    }
  })();

  async function writeRemote(action: () => PromiseLike<{ error: { message: string } | null }>) {
    if (!remote || !supabase) return null;
    try {
      const { error } = await action();
      return error ? `Saved locally, but Supabase rejected the write: ${error.message}` : null;
    } catch (e) {
      return `Saved locally, but Supabase is unreachable: ${(e as Error).message}`;
    }
  }

  return {
    getAll: () => items,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    upsert: async (item) => {
      const idx = items.findIndex((i) => i.id === item.id);
      const next = idx === -1 ? [...items, item] : items.map((i) => (i.id === item.id ? item : i));
      persist(next);
      return writeRemote(() => remoteTable().upsert(remote!.toRow(item)));
    },
    remove: async (id) => {
      persist(items.filter((i) => i.id !== id));
      return writeRemote(() => remoteTable().delete().eq("id", id));
    },
    resetToSeed: () => {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      edited = false;
      items = seed;
      listeners.forEach((l) => l());
    },
    hasLocalEdits: () => edited,
    ready,
  };
}
