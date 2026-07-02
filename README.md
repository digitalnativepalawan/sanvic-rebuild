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
| **Today** (`/`) | The launch screen is the living San Vicente map — barangay lines and destination pins visible immediately — with today's ranked recommendations (time-of-day and weather aware) as a map-connected overlay: floating side panel on desktop, peek-height bottom sheet on mobile. Greeting, weather + sunset, Ask Tala, and the top local signal live in the overlay; every card's "View on map" focuses its pin in place. |
| **Explore** (`/explore`) | Full-catalogue discovery on the same map. Desktop: place list + map side by side. Mobile: full-bleed map with floating category chips and a bottom sheet. Pins are category-coded (color + icon), matching the chips. |
| **Trip** (`/trip`) | Saved places organized into Today / Tomorrow / Later, with a suggested visiting order from Poblacion. Local-first, anonymous session — no login. |
| **Pulse** (`/pulse`) | Local Updates, not a social feed: beach conditions, sunset window, boat status, road updates, food tips, events. Live weather becomes a first-class update when available. |
| **Place detail** (`/place/:slug`) | Full detail: photo (with designed fallback), rating, barangay, travel time from Poblacion, best time/season, tags, Directions / Save / Ask Tala / Book–Contact / View on map. |
| **Admin** (`/admin`) | Passkey-gated content management: places, Today recommendations, Pulse updates, and barangays — fully editable without Supabase (local drafts) and write-through when Supabase is connected. |

**Tala** is the intelligence layer, not a tab: a slide-over guide reachable from every screen.
It answers with structured results — message + place cards + map focus + follow-up suggestions —
driven by a data-aware rules engine over the catalogue and recommendation engine.

**Barangay boundaries** are a core map layer, not decoration. The map renders the ten
communities (Poblacion, New Agutaya, San Isidro, Alimanguan, Santo Niño, New Canipo, Binga,
Kemdeng, Port Barton, Caruray) as dashed boundary lines with quiet uppercase labels,
a Barangays layer toggle, and a fixed sand-colored Poblacion reference marker. Geometry is
real PSA PSGC data (via [philippines-json-maps](https://github.com/faeldon/philippines-json-maps), MIT).

**The map is data-driven and constrained.** `src/lib/mapBounds.ts` computes the initial
viewport by fitting the barangay boundary GeoJSON plus all valid place coordinates (anything
outside a Palawan sanity window is excluded, so one bad marker can never zoom the map out to
the whole Philippines), and derives a hard `maxBounds` pan limit (~100 km around the
municipality) from the same geometry — you can explore around Palawan but not drag off to
Manila or open ocean. Three map modes ship via keyless public tile services — **Navy**
(Carto dark), **Street** (OSM), **Satellite** (Esri World Imagery) — switchable from the
floating Layers control on all devices and persisted to localStorage.

**Hidden admin access:** triple-click/tap the SANVIC logo within 3 seconds to open `/admin`
(still passkey-gated). The direct route and the desktop gear icon also work.

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
  data/            Seed content (places, recommendations, local updates,
                   categories, barangays, PSA boundary GeoJSON)
                   — shaped 1:1 to the Supabase tables
  lib/             supabase client (optional), session id, shared utils
  services/        THE data access layer. UI never touches Supabase or seed
                   arrays directly:
    contentService       generic editable stores: seed → localStorage drafts
                         → Supabase hydration + write-through (powers /admin)
    placesService        places + local updates stores and read API
    recommendationEngine ranked "what to do now" (time + weather aware)
    barangayService      barangay metadata store + boundary features
    talaService          Tala provider interface + local rules provider
    tripService          local-first trip persistence (pub/sub + localStorage)
    weatherService       Open-Meteo live weather with seasonal fallback
  hooks/           useWeather, useTrip, useMediaQuery
  components/      layout (AppShell/nav), places (cards, image fallback, save),
                   map (category pins, BarangayBoundaryLayer, MapLayerControls),
                   tala (panel + context)
  pages/           Today, Explore, Trip, Pulse, PlaceDetail, admin/ (editors)
supabase/
  migrations/0001_initial_schema.sql   core schema + RLS
  migrations/0002_barangays_and_admin.sql  barangays, boundaries, admin columns
  seed.sql                             seed data generated from src/data
```

Key decisions:

- **No login before value.** An anonymous session id (localStorage) keys saves and trips;
  the schema's `user_session_id` columns let it sync to Supabase later without a rewrite.
- **Every travel time is spelled out** ("10 min from Poblacion", "1 h 20 min from Poblacion") —
  never ambiguous "5m".
- **Pins mean something.** One color + icon per category, identical in chips, cards, and map pins.
- **Missing images are designed, not broken** — category-tinted gradient + icon fallback.

## Admin

Open `/admin` (also the gear icon in the desktop header).

- **Passkey**: `VITE_ADMIN_PASSKEY` env var. If unset, the dev server falls back to `5309`;
  production builds without a passkey keep admin locked.
- **What's editable**: Places (all fields incl. coordinates, images, travel time, booking URL,
  featured/active), Today recommendations (place, title, copy, context, weather, audience,
  priority, active), Pulse local updates (title, body, category, location, severity, source,
  validity window, active), Barangays (display name, description, label anchor, label
  visibility, display order, active).
- **Without Supabase**: edits persist to this browser's localStorage ("Local draft mode" banner)
  and are reflected across Today / Explore / Trip / Pulse / Tala immediately. "Reset to seed"
  discards drafts per section.
- **With Supabase**: stores hydrate from the tables on startup and every admin write goes
  through the service layer to Supabase (with localStorage as offline cache). Write failures
  surface as a warning in the admin UI.

**Security status — read this before production.** The passkey ships in the client bundle;
it is a demo gate, not authentication. Content tables are read-only by default under RLS, so
admin write-through requires the clearly-marked DEMO policies in
`supabase/migrations/0002_barangays_and_admin.sql` (commented out). Production admin must move
to Supabase Auth + role-checked RLS policies (or an Edge Function) — the pattern is documented
in that migration.

## Connecting Supabase later

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql`, then
   `supabase/migrations/0002_barangays_and_admin.sql` (SQL editor or `supabase db push`).
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

All content (places, recommendation copy, local updates, barangays) lives in `src/data/*.ts`
as seed, is editable through `/admin`, and maps 1:1 to the Supabase tables — nothing editorial
is hardcoded in components.

## Known TODOs / risks

- **Admin security is prototype-grade** (client-side passkey + DEMO write policies if enabled).
  Move to Supabase Auth + role-checked RLS or an Edge Function before real production. This is
  the top production blocker.
- **Trip → Supabase sync** is prepared (schema + session id) but not wired; trips are per-device.
- **Trip sharing** is a visible placeholder pending Supabase sync.
- **Boundary geometry ships in the frontend** (`src/data/barangayBoundaries.ts`); the
  `barangay_boundaries` table exists for when boundary editing moves server-side.
- **Coordinates are approximate** for area-level entries (e.g. "Grill Row"); refine as real
  businesses are onboarded.
- **Seed `image_url`s** are app-relative paths (`/images/...`); move media to Supabase Storage
  when content goes live.
- **Anonymous-session RLS** (trips/saves) is permissive by design for launch; tighten with auth
  (see migration comments).
- Map tiles are OpenStreetMap; swap in a styled tile provider for a fully branded map later.
