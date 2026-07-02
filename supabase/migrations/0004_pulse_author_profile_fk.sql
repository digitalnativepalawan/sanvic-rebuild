-- SANVIC 0004: re-point Pulse author/user FKs at profiles instead of
-- auth.users. profiles.id already 1:1-references auth.users(id) (and a row
-- is guaranteed to exist before anyone can post, via the handle_new_user
-- trigger), so this is safe and lets PostgREST embed author display_name /
-- avatar_url directly in feed queries (`pulse_posts.select("*, author:profiles(...)")`).

alter table public.pulse_posts drop constraint pulse_posts_author_id_fkey;
alter table public.pulse_posts
  add constraint pulse_posts_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.pulse_comments drop constraint pulse_comments_author_id_fkey;
alter table public.pulse_comments
  add constraint pulse_comments_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

alter table public.pulse_likes drop constraint pulse_likes_user_id_fkey;
alter table public.pulse_likes
  add constraint pulse_likes_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
