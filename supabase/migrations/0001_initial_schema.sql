-- SANVIC initial schema
-- Content tables (places, recommendations, local_updates) are publicly
-- readable and admin-writable. User tables (saved_places, trips, trip_items,
-- tala_messages) are keyed by an anonymous session id — no auth required to
-- use the product. Tighten those policies when/if real auth is introduced.

-- ── places ──────────────────────────────────────────────────
create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in
    ('beaches','islands','food','stays','nature','culture','work','events')),
  description text not null default '',
  short_reason text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  barangay text not null default '',
  address text,
  image_url text,
  gallery text[],
  rating numeric(2,1) check (rating >= 0 and rating <= 5),
  price_level smallint check (price_level between 1 and 4),
  best_time text,
  best_season text,
  travel_minutes_from_poblacion integer,
  travel_note text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_category_idx on public.places (category) where is_active;
create index places_featured_idx on public.places (is_featured) where is_active;

-- ── recommendations ─────────────────────────────────────────
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  context_type text not null check (context_type in
    ('morning','midday','afternoon','sunset','evening','rainy','any')),
  title text not null,
  reason text not null,
  priority integer not null default 10,
  weather_condition text check (weather_condition in ('clear','cloudy','rain','any')),
  time_of_day text,
  audience text check (audience in ('solo','couple','family','nomad','any')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index recommendations_context_idx on public.recommendations (context_type) where is_active;

-- ── local_updates (Pulse) ───────────────────────────────────
create table public.local_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in
    ('beach','sunset','food','travel','island-hopping','event','weather','tip')),
  location text,
  severity text not null default 'info' check (severity in ('info','good','watch','alert')),
  source text not null default 'SANVIC',
  image_url text,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now()
);

create index local_updates_created_idx on public.local_updates (created_at desc);

-- ── anonymous-session user data ─────────────────────────────
create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_session_id text not null,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_session_id, place_id)
);

create index saved_places_session_idx on public.saved_places (user_session_id);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_session_id text not null,
  title text not null default 'My trip',
  date date,
  created_at timestamptz not null default now()
);

create index trips_session_idx on public.trips (user_session_id);

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  sort_order integer not null default 0,
  note text,
  planned_time text,
  created_at timestamptz not null default now()
);

create index trip_items_trip_idx on public.trip_items (trip_id);

create table public.tala_messages (
  id uuid primary key default gen_random_uuid(),
  user_session_id text not null,
  role text not null check (role in ('user','tala')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index tala_messages_session_idx on public.tala_messages (user_session_id, created_at);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
alter table public.places enable row level security;
alter table public.recommendations enable row level security;
alter table public.local_updates enable row level security;
alter table public.saved_places enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
alter table public.tala_messages enable row level security;

-- Content: anyone can read active rows; writes only via service role /
-- future admin role (no insert/update/delete policies for anon).
create policy "Public read places" on public.places
  for select using (is_active);
create policy "Public read recommendations" on public.recommendations
  for select using (is_active);
create policy "Public read local updates" on public.local_updates
  for select using (true);

-- Session data: anonymous clients may insert and read/delete rows. Note:
-- without auth the session id is the only fence — acceptable for
-- low-sensitivity trip data now. RECOMMENDATION: when auth arrives, add
-- a user_id column, migrate, and scope these policies to auth.uid().
create policy "Anon manage saved places" on public.saved_places
  for all using (true) with check (true);
create policy "Anon manage trips" on public.trips
  for all using (true) with check (true);
create policy "Anon manage trip items" on public.trip_items
  for all using (true) with check (true);
create policy "Anon write tala messages" on public.tala_messages
  for insert with check (true);
create policy "Anon read tala messages" on public.tala_messages
  for select using (true);
