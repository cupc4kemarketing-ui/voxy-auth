-- ============================================================================
-- VOXY CLIENT — SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- ============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLE: profiles
-- One row per authenticated (Discord) user. Created automatically via trigger
-- on auth.users insert.
-- ============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  discord_id    text not null,
  username      text not null,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists profiles_discord_id_idx on public.profiles (discord_id);

-- ============================================================================
-- TABLE: admins
-- Explicit allow-list of admin users. Membership is managed manually
-- (or via another trusted admin) — never derived from client input.
-- ============================================================================
create table if not exists public.admins (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- TABLE: license_keys
-- The pool of generated redeemable keys. A key is consumed exactly once.
-- ============================================================================
create type public.license_duration as enum ('14_days', '30_days', 'lifetime');
create type public.license_key_status as enum ('unused', 'redeemed', 'disabled');

create table if not exists public.license_keys (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  duration      public.license_duration not null,
  status        public.license_key_status not null default 'unused',
  created_at    timestamptz not null default now(),
  created_by    uuid references public.profiles (id),
  redeemed_by   uuid references public.profiles (id),
  redeemed_at   timestamptz
);

create index if not exists license_keys_status_idx on public.license_keys (status);
create index if not exists license_keys_redeemed_by_idx on public.license_keys (redeemed_by);

-- ============================================================================
-- TABLE: licenses
-- The active subscription record for a user, created when a license_key
-- is successfully redeemed.
-- ============================================================================
create type public.license_status as enum ('active', 'expired', 'revoked');

create table if not exists public.licenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  license_key_id  uuid not null references public.license_keys (id),
  duration        public.license_duration not null,
  status          public.license_status not null default 'active',
  started_at      timestamptz not null default now(),
  expires_at      timestamptz, -- null == lifetime
  created_at      timestamptz not null default now()
);

create index if not exists licenses_user_id_idx on public.licenses (user_id);
create index if not exists licenses_status_idx on public.licenses (status);

-- ============================================================================
-- TABLE: downloads
-- Every time a user downloads the client jar, a row is recorded here.
-- ============================================================================
create table if not exists public.downloads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  version        text not null,
  filename       text not null,
  downloaded_at  timestamptz not null default now()
);

create index if not exists downloads_user_id_idx on public.downloads (user_id);

-- ============================================================================
-- TABLE: releases
-- Published client versions. Latest active release is served to entitled users.
-- ============================================================================
create table if not exists public.releases (
  id            uuid primary key default gen_random_uuid(),
  version       text not null unique,
  changelog     text not null default '',
  file_path     text not null, -- path inside the private "client-builds" storage bucket
  is_latest     boolean not null default false,
  released_at   timestamptz not null default now()
);

-- ============================================================================
-- FUNCTION + TRIGGER: auto-create a profile row when a user signs in via
-- Discord OAuth for the first time.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, discord_id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'provider_id', new.raw_user_meta_data ->> 'sub', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'user_name', 'Voxy User'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    discord_id = excluded.discord_id,
    username   = excluded.username,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep profile in sync on subsequent logins (avatar/name can change on Discord)
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- FUNCTION: is_admin(uid) — helper used inside RLS policies
-- ============================================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.user_id = uid);
$$;

-- ============================================================================
-- FUNCTION: expire_licenses() — flips active licenses past their expiry to
-- 'expired'. Call periodically (Supabase cron / pg_cron) or on read paths.
-- ============================================================================
create or replace function public.expire_licenses()
returns void
language sql
security definer set search_path = public
as $$
  update public.licenses
  set status = 'expired'
  where status = 'active'
    and expires_at is not null
    and expires_at < now();
$$;

-- Optional: schedule it every 15 minutes if pg_cron is enabled on the project
-- select cron.schedule('expire-licenses', '*/15 * * * *', $$select public.expire_licenses();$$);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles     enable row level security;
alter table public.admins       enable row level security;
alter table public.license_keys enable row level security;
alter table public.licenses     enable row level security;
alter table public.downloads    enable row level security;
alter table public.releases     enable row level security;

-- profiles: a user can read/update only their own profile; admins can read all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- admins: only admins can view the admin list
drop policy if exists "admins_select_admin_only" on public.admins;
create policy "admins_select_admin_only"
  on public.admins for select
  using (public.is_admin(auth.uid()));

-- license_keys: only admins may read/write via the client; all mutations in
-- this app actually go through server routes using the service role key,
-- which bypasses RLS entirely. These policies are the safety net.
drop policy if exists "license_keys_admin_all" on public.license_keys;
create policy "license_keys_admin_all"
  on public.license_keys for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- licenses: a user can see their own licenses; admins can see everything
drop policy if exists "licenses_select_own_or_admin" on public.licenses;
create policy "licenses_select_own_or_admin"
  on public.licenses for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "licenses_admin_write" on public.licenses;
create policy "licenses_admin_write"
  on public.licenses for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- downloads: a user can see their own download history; admins see all
drop policy if exists "downloads_select_own_or_admin" on public.downloads;
create policy "downloads_select_own_or_admin"
  on public.downloads for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "downloads_admin_write" on public.downloads;
create policy "downloads_admin_write"
  on public.downloads for insert
  with check (public.is_admin(auth.uid()) or auth.uid() = user_id);

-- releases: any authenticated user can read release metadata; only admins write
drop policy if exists "releases_select_authenticated" on public.releases;
create policy "releases_select_authenticated"
  on public.releases for select
  using (auth.role() = 'authenticated');

drop policy if exists "releases_admin_write" on public.releases;
create policy "releases_admin_write"
  on public.releases for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================================
-- SEED: make yourself an admin after your first login by running, e.g.:
--
--   insert into public.admins (user_id)
--   values ('00000000-0000-0000-0000-000000000000');
--
-- (replace with your profiles.id, found in the "profiles" table)
--
-- SEED: add a sample release
--
--   insert into public.releases (version, changelog, file_path, is_latest)
--   values ('1.0.0', '- Initial public release', 'releases/1.0.0/voxy.jar', true);
-- ============================================================================
