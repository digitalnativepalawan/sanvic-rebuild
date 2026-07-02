-- SANVIC 0002: barangays, boundary storage, and admin-editing columns.

-- ── barangays ───────────────────────────────────────────────
create table public.barangays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  label_visible boolean not null default true,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger barangays_updated_at before update on public.barangays
  for each row execute function public.set_updated_at();

-- Boundary geometry per barangay. The frontend currently ships PSA-derived
-- GeoJSON (src/data/barangayBoundaries.ts); this table is the future home
-- for higher-resolution or hand-edited polygons.
create table public.barangay_boundaries (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangays(id) on delete cascade,
  geojson jsonb not null,
  source text not null default 'PSA PSGC via philippines-json-maps (MIT)',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barangay_id)
);

create trigger barangay_boundaries_updated_at before update on public.barangay_boundaries
  for each row execute function public.set_updated_at();

-- ── admin-editing columns on existing tables ────────────────
alter table public.places add column booking_url text;
alter table public.local_updates add column is_active boolean not null default true;

-- ── Row Level Security ──────────────────────────────────────
alter table public.barangays enable row level security;
alter table public.barangay_boundaries enable row level security;

create policy "Public read barangays" on public.barangays
  for select using (is_active);
create policy "Public read barangay boundaries" on public.barangay_boundaries
  for select using (true);

-- ── ADMIN WRITE ACCESS — read before enabling ───────────────
-- Content tables (places, recommendations, local_updates, barangays,
-- barangay_boundaries) are read-only for anon/authenticated clients by
-- default: with RLS enabled and no write policies, writes are rejected.
--
-- The /admin screen writes through the anon key. That only works if you
-- opt into DEMO policies like the ones below. They let ANYONE with your
-- anon key write content — acceptable for a private prototype/Lovable
-- preview, NOT for production. Uncomment deliberately:
--
-- create policy "DEMO anon write places" on public.places
--   for all using (true) with check (true);
-- create policy "DEMO anon write recommendations" on public.recommendations
--   for all using (true) with check (true);
-- create policy "DEMO anon write local_updates" on public.local_updates
--   for all using (true) with check (true);
-- create policy "DEMO anon write barangays" on public.barangays
--   for all using (true) with check (true);
-- create policy "DEMO anon write barangay_boundaries" on public.barangay_boundaries
--   for all using (true) with check (true);
--
-- Production path: add Supabase Auth, a user_roles table with a has_role()
-- helper (security definer), replace the DEMO policies with
--   for all to authenticated using (has_role(auth.uid(), 'admin')) ...
-- and put the /admin route behind a real session instead of the passkey.
