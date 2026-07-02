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
| **Explorer** (`/explore`) | Full-catalogue discovery on the same map. Desktop: place list + map side by side. Mobile: full-bleed map with floating category chips and a bottom sheet. Pins are category-coded (color + icon), matching the chips. |
| **Pulse** (`/pulse`) | Two tabs. **Live Feed**: the real community — signed-in users post text + photos/video to channels (Hidden Spots, Island Hopping, Food & Nightlife, Surf Report, Events Tonight), like and comment, in real time (Supabase Realtime). **Local Updates**: the original trustworthy admin-curated signal feed (conditions, boats, roads, events), unchanged. |
| **My Trip** (`/trip`) | Your personal profile: identity header (sign in for a synced profile, or stay anonymous), quick actions, a saved-places strip, recent activity, and the day-by-day plan (Today / Tomorrow / Later) with a suggested visiting order from Poblacion. Saving places never requires login; the profile identity layer is optional on top. |
| **Locate** (nav button) | Asks the browser for your position, jumps to the map, and shows a pulsing "you are here" dot with an accuracy circle — so you can orient yourself and get directions. Gracefully reports denied permission or an out-of-Palawan fix. |
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

**Login is optional and easy.** Supabase Auth email magic link — enter an email, click the
link, done. No password, no custom backend. Signing in unlocks a synced profile (My Trip
header, display name/avatar) and the ability to post/like/comment in Pulse's Live Feed;
browsing, saving places, and planning a trip never require it.

## Running locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # type-check + production build
npm run preview
```

No environment variables required for the core app — it runs on bundled seed data out of the
box. Login and Pulse's Live Feed need Supabase (see below); everything else works without it.

## Architecture

```
src/
  types/           Domain types + hand-written Supabase Database types
  data/            Seed content (places, recommendations, local updates,
                   categories, barangays, PSA boundary GeoJSON)
                   — shaped 1:1 to the Supabase tables
  lib/             supabase client (optional), session id, shared utils,
                   mapBounds (data-driven viewport + Palawan pan limit)
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
    authService          Supabase Auth (magic link) + profile + role state
    pulseFeedService     Pulse Live Feed: posts/comments/likes, media upload,
                         Realtime subscription — requires Supabase
    locationService      browser geolocation for the Locate button
  hooks/           useWeather, useTrip, useMediaQuery, useAuth
  components/      layout (AppShell/nav), places (cards, image fallback, save),
                   map (category pins, BarangayBoundaryLayer, MapLayerControls,
                   UserLocationLayer), tala (panel + context),
                   auth (LoginModal), pulse (composer, post card)
  pages/           Today, Explore, Trip (profile), Pulse, PlaceDetail,
                   admin/ (editors)
supabase/
  migrations/0001_initial_schema.sql        core schema + RLS
  migrations/0002_barangays_and_admin.sql   barangays, boundaries, admin columns
  migrations/0003_auth_profiles_and_pulse_chat.sql
                                             profiles, user_roles + has_role(),
                                             pulse_posts/comments/likes, RLS
  migrations/0004_pulse_author_profile_fk.sql
                                             re-points Pulse author FKs at
                                             profiles so PostgREST can embed
                                             author display_name/avatar_url
  seed.sql                                  seed data generated from src/data
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
it is a demo gate, not authentication. Content-table writes are protected by RLS with two
policies per table (see `0003`, "Admin write access"): a real one scoped to authenticated
users with the `admin` role (`has_role(auth.uid(), 'admin')`), and a DEMO anon-write policy
that lets the passkey-only `/admin` screen function today. Both are active — either being
satisfied grants access. Before real production: move `/admin` onto a Supabase Auth session
(reusing the same login as the rest of the app) and drop the DEMO policies, leaving only the
role-checked one.

## Connecting Supabase

Login, the My Trip profile identity, and Pulse's Live Feed all require a real Supabase
project — this is genuinely multi-user content, unlike the rest of the app's local-first
fallback. Places/Today/Local Updates/Barangays admin content still works fine without it
(localStorage-only drafts).

1. Create a Supabase project.
2. Run the migrations in order (SQL editor or `supabase db push`):
   `0001_initial_schema.sql` → `0002_barangays_and_admin.sql` →
   `0003_auth_profiles_and_pulse_chat.sql` → `0004_pulse_author_profile_fk.sql`.
3. Run `supabase/seed.sql` to load the starter content.
4. Create a public Storage bucket named `pulse-media` (50 MB limit; image/* and video/mp4,
   video/webm, video/quicktime) with these policies on `storage.objects`:
   - public `select` where `bucket_id = 'pulse-media'`
   - authenticated `insert`/`delete` where `bucket_id = 'pulse-media' and (storage.foldername(name))[1] = auth.uid()::text`
5. Authentication → URL Configuration: add your dev URL (`http://localhost:8080`) and your
   deployed URL(s) to **Redirect URLs**, and set **Site URL** to your primary deployed URL —
   otherwise the magic-link email will redirect somewhere invalid.
6. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
7. Restart the dev server. Content services automatically prefer Supabase (with a 5s timeout
   per request before falling back to seed/local data — see "Network resilience" below);
   `authService` and `pulseFeedService` require it outright.
8. **Grant yourself admin** (optional, only needed to move `/admin` off the passkey later):
   sign in once via the app so a `profiles` row exists, then in the SQL editor:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com';
   ```

On Vercel (or any host), add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
`VITE_ADMIN_PASSKEY` as environment variables and redeploy — env var changes don't apply to
already-built deployments.

Only the anon key belongs in the frontend — never a service-role key. Session tables
(saves/trips) are open for anonymous writes for now, with a documented recommendation to
scope them to `auth.uid()` once trips move onto real auth too.

To regenerate DB types after schema changes:
`npx supabase gen types typescript --project-id <id> > src/types/database.ts`
(the project currently hand-maintains `src/types/database.ts` in the same shape instead).

### Network resilience

Every Supabase call in `contentService` and `pulseFeedService` races against a timeout (5–6s)
before falling back to seed/local/empty state — a slow or unreachable connection shows
content promptly instead of hanging indefinitely. On a healthy connection this is invisible
(real requests resolve in tens of milliseconds).

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

- **Admin security is prototype-grade** (client-side passkey + DEMO write policies active
  alongside the real role-checked ones). Move `/admin` onto the same Supabase Auth session as
  the rest of the app, grant your account the `admin` role (see above), and drop the DEMO
  policies before real production. This is the top production blocker.
- **Trip → Supabase sync** is prepared (schema + session id) but not wired; trips are per-device
  even when signed in. The profile identity (My Trip header, Pulse authorship) is separate from
  trip data today.
- **Trip sharing** is a visible placeholder pending Supabase sync.
- **Pulse Live Feed has no moderation queue** — admins can delete any post/comment inline
  (the trash icon on a card, visible to the author or an `admin`-role user), but there's no
  report/flag flow yet.
- **"Nearby" and "Rooms"** from the Pulse reference design weren't built — Nearby needs
  geolocation-based proximity ranking, Rooms needs private/group threads; both are larger
  features than this pass. Only Live Feed and Local Updates ship as tabs.
- **Boundary geometry ships in the frontend** (`src/data/barangayBoundaries.ts`); the
  `barangay_boundaries` table exists for when boundary editing moves server-side.
- **Coordinates are approximate** for area-level entries (e.g. "Grill Row"); refine as real
  businesses are onboarded.
- **Seed `image_url`s** are app-relative paths (`/images/...`); move media to Supabase Storage
  when content goes live.
- **Anonymous-session RLS** (trips/saves) is permissive by design for launch; tighten with auth
  (see migration comments).
- Map tiles are OpenStreetMap; swap in a styled tile provider for a fully branded map later.
