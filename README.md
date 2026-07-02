# SANVIC

**The AI-native local guide for San Vicente, Palawan.**

Today's best beach, food, sunset, stays, local updates, and trip planning — powered by Tala,
clean local data, and an interactive map. The product answers one question:
**"What should I do next?"**

Built as a clean Vite + React + TypeScript + Tailwind SPA. Runs entirely on bundled seed data,
Supabase-ready when you are, and importable into Lovable as-is.

---

## Product structure

| Screen | Purpose |
| --- | --- |
| **Today** (`/`) | The primary decision screen: greeting, live weather + sunset pill, Ask Tala, top local signal, and 3–5 ranked recommendation cards for *right now* (time-of-day and weather aware). |
| **Explore** (`/explore`) | Map-first discovery. Desktop: place list + map side by side. Mobile: full-bleed map with floating category chips and a bottom sheet. Pins are category-coded (color + icon), matching the chips. |
| **Trip** (`/trip`) | Saved places organized into Today / Tomorrow / Later, with a suggested visiting order from Poblacion. Local-first, anonymous session — no login. |
| **Pulse** (`/pulse`) | Local Updates, not a social feed: beach conditions, sunset window, boat status, road updates, food tips, events. Live weather becomes a first-class update when available. |
| **Place detail** (`/place/:slug`) | Full detail: photo (with designed fallback), rating, barangay, travel time from Poblacion, best time/season, tags, Directions / Save / Ask Tala / View on map. |

**Tala** is the intelligence layer, not a tab: a slide-over guide reachable from every screen.
It answers with structured results — message + place cards + map focus + follow-up suggestions —
driven by a data-aware rules engine over the catalogue and recommendation engine.

## Running locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # type-check + production build
npm run preview
```

No environment variables required — the app runs on bundled seed data out of the box.

## Architecture

```
src/
  types/           Domain types + hand-written Supabase Database types
  data/            Seed content (places, recommendations, local updates, categories)
                   — shaped 1:1 to the Supabase tables
  lib/             supabase client (optional), session id, shared utils
  services/        THE data access layer. UI never touches Supabase or seed
                   arrays directly:
    placesService        places + local updates (Supabase → seed fallback)
    recommendationEngine ranked "what to do now" (time + weather aware)
    talaService          Tala provider interface + local rules provider
    tripService          local-first trip persistence (pub/sub + localStorage)
    weatherService       Open-Meteo live weather with seasonal fallback
  hooks/           useWeather, useTrip (useSyncExternalStore over tripService)
  components/      layout (AppShell/nav), places (cards, image fallback, save),
                   map (Leaflet w/ category pins), tala (panel + context)
  pages/           Today, Explore, Trip, Pulse, PlaceDetail
supabase/
  migrations/0001_initial_schema.sql   full schema + RLS
  seed.sql                             seed data generated from src/data
```

Key decisions:

- **No login before value.** An anonymous session id (localStorage) keys saves and trips;
  the schema's `user_session_id` columns let it sync to Supabase later without a rewrite.
- **Every travel time is spelled out** ("10 min from Poblacion", "1 h 20 min from Poblacion") —
  never ambiguous "5m".
- **Pins mean something.** One color + icon per category, identical in chips, cards, and map pins.
- **Missing images are designed, not broken** — category-tinted gradient + icon fallback.

## Connecting Supabase later

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql` (SQL editor or `supabase db push`).
3. Run `supabase/seed.sql` to load the starter content.
4. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
5. Restart the dev server. `placesService` and `getLocalUpdates` automatically prefer
   Supabase and fall back to seed data if the fetch fails or tables are empty.

Only the anon key belongs in the frontend — never a service-role key. Content tables are
public-read / admin-write (RLS); session tables are open for anonymous writes for now, with a
documented recommendation to scope them to `auth.uid()` once real auth is introduced.

To regenerate DB types after schema changes:
`npx supabase gen types typescript --project-id <id> > src/types/database.ts`

### Upgrading Tala to a real model

`talaService` exposes a `TalaProvider` interface; the current provider is a local rules engine.
To go AI-native: deploy a Supabase Edge Function that calls an LLM with the place catalogue +
context (time, weather, saved places) and returns the same `TalaResponse` shape, then register it
via `setTalaProvider()`. No UI changes required.

## Content management

All content (places, recommendation copy, local updates) lives in `src/data/*.ts` today and in
the matching Supabase tables tomorrow — nothing editorial is hardcoded in components. Once
Supabase is connected, an admin UI (or Lovable itself) can edit rows directly; the app already
reads from the tables first.

## Known TODOs / risks

- **Trip → Supabase sync** is prepared (schema + session id) but not wired; trips are per-device.
- **Trip sharing** is a visible placeholder pending Supabase sync.
- **Coordinates are approximate** for area-level entries (e.g. "Grill Row"); refine as real
  businesses are onboarded.
- **Seed `image_url`s** are app-relative paths (`/images/...`); move media to Supabase Storage
  when content goes live.
- **Anonymous-session RLS** is permissive by design for launch; tighten with auth (see migration
  comments).
- Map tiles are OpenStreetMap; swap in a styled tile provider for a fully branded map later.
