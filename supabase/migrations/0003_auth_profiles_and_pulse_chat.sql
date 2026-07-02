-- SANVIC 0003: real auth, profiles, and Pulse as a live community feed.
--
-- Login is Supabase Auth (email magic link) — no passwords, no custom
-- backend. Profiles are the "My Trip" personal-profile identity; trips and
-- saved places stay anonymous-session-scoped as before (no login required
-- to save places), but the profile screen shows both once you're signed in.
--
-- Pulse becomes multi-user: posts, comments, and likes are owned by
-- auth.uid() and protected by real RLS (not the DEMO anon-write pattern
-- used for admin content) because this is user-generated content.

-- ── profiles ────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row the moment someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── roles (real admin path — see 0002 DEMO policy note) ────
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(uid uuid, target_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles where user_id = uid and role = target_role
  );
$$;

-- ── pulse_posts (the community feed) ───────────────────────
create table public.pulse_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'all' check (channel in
    ('all','hidden-spots','island-hopping','food-nightlife','surf-report','events-tonight')),
  body text not null check (char_length(body) between 1 and 2000),
  location text,
  media_urls text[] not null default '{}',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pulse_posts_channel_idx on public.pulse_posts (channel, created_at desc);
create trigger pulse_posts_updated_at before update on public.pulse_posts
  for each row execute function public.set_updated_at();

create table public.pulse_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.pulse_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index pulse_comments_post_idx on public.pulse_comments (post_id, created_at);

create table public.pulse_likes (
  post_id uuid not null references public.pulse_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.pulse_posts enable row level security;
alter table public.pulse_comments enable row level security;
alter table public.pulse_likes enable row level security;

create policy "Public read profiles" on public.profiles
  for select using (true);
create policy "Own profile write" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Public read roles" on public.user_roles
  for select using (true);

create policy "Public read posts" on public.pulse_posts
  for select using (true);
create policy "Authenticated create posts" on public.pulse_posts
  for insert to authenticated with check (auth.uid() = author_id);
create policy "Own post update" on public.pulse_posts
  for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "Own post or admin delete" on public.pulse_posts
  for delete to authenticated
  using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));

create policy "Public read comments" on public.pulse_comments
  for select using (true);
create policy "Authenticated create comments" on public.pulse_comments
  for insert to authenticated with check (auth.uid() = author_id);
create policy "Own comment or admin delete" on public.pulse_comments
  for delete to authenticated
  using (auth.uid() = author_id or public.has_role(auth.uid(), 'admin'));

create policy "Public read likes" on public.pulse_likes
  for select using (true);
create policy "Own like write" on public.pulse_likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Own like delete" on public.pulse_likes
  for delete to authenticated using (auth.uid() = user_id);

-- ── Admin write access ──────────────────────────────────────
-- Two policies per table, deliberately both active (Postgres RLS policies
-- are OR'd — either one being satisfied grants access):
--
-- 1. "Admin write X" — the real path: an authenticated user with the
--    'admin' role in user_roles. Grant it with:
--      insert into public.user_roles (user_id, role) values ('<uid>', 'admin');
--    once someone has signed in once via email magic link.
-- 2. "DEMO anon write X" — the /admin screen currently gates on a
--    client-side passkey only (VITE_ADMIN_PASSKEY), not a Supabase login,
--    so without this the passkey would unlock the UI but every write would
--    be silently rejected by RLS. This lets anyone holding the anon key
--    write content — acceptable for this prototype/showcase, NOT
--    real production. Move the admin route onto Supabase Auth + policy 1
--    only, then drop these DEMO policies, before this is a public product.
create policy "Admin write places" on public.places
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "DEMO anon write places" on public.places
  for all using (true) with check (true);

create policy "Admin write recommendations" on public.recommendations
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "DEMO anon write recommendations" on public.recommendations
  for all using (true) with check (true);

create policy "Admin write local_updates" on public.local_updates
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "DEMO anon write local_updates" on public.local_updates
  for all using (true) with check (true);

create policy "Admin write barangays" on public.barangays
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "DEMO anon write barangays" on public.barangays
  for all using (true) with check (true);

create policy "Admin write barangay_boundaries" on public.barangay_boundaries
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "DEMO anon write barangay_boundaries" on public.barangay_boundaries
  for all using (true) with check (true);
