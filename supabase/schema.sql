-- ============================================================
-- AWO Course – Supabase Database Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- ── Profiles ──────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade not null primary key,
  username      text unique not null,
  ops_name      text,
  full_name     text not null default '',
  appointment   text,
  contact_number text,
  telegram      text,
  whatsapp      text,
  email         text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: check if the calling user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- ── Parade State ──────────────────────────────────────────
create table public.parade_state (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  week_start   date not null,                              -- always a Monday
  day_of_week  smallint not null check (day_of_week between 0 and 6), -- 0 = Mon … 6 = Sun
  status       text not null check (status in ('in_camp','out_of_camp','rso','rsi','medical_appt')),
  notes        text,
  updated_at   timestamptz not null default now(),
  unique (user_id, week_start, day_of_week)
);

alter table public.parade_state enable row level security;

create policy "parade_select" on public.parade_state
  for select to authenticated using (true);

create policy "parade_insert_own" on public.parade_state
  for insert to authenticated with check (auth.uid() = user_id);

create policy "parade_update_own_or_admin" on public.parade_state
  for update to authenticated using (auth.uid() = user_id or public.is_admin());

create policy "parade_delete_own_or_admin" on public.parade_state
  for delete to authenticated using (auth.uid() = user_id or public.is_admin());

-- ── Course Roles ──────────────────────────────────────────
create table public.course_roles (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  holder_id   uuid references public.profiles(id) on delete set null,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.course_roles enable row level security;

create policy "roles_select" on public.course_roles
  for select to authenticated using (true);

create policy "roles_all_admin" on public.course_roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Lessons Learned ───────────────────────────────────────
create table public.lessons (
  id        uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title     text not null,
  content   text not null,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "lessons_select" on public.lessons
  for select to authenticated using (true);

create policy "lessons_insert_own" on public.lessons
  for insert to authenticated with check (auth.uid() = author_id);

create policy "lessons_update_own_or_admin" on public.lessons
  for update to authenticated using (auth.uid() = author_id or public.is_admin());

create policy "lessons_delete_own_or_admin" on public.lessons
  for delete to authenticated using (auth.uid() = author_id or public.is_admin());

-- ── Resources ─────────────────────────────────────────────
create table public.resources (
  id          uuid default gen_random_uuid() primary key,
  uploader_id uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  description text,
  category    text not null,
  file_url    text not null,
  file_name   text not null,
  file_size   bigint,
  created_at  timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "resources_select" on public.resources
  for select to authenticated using (true);

create policy "resources_insert_own" on public.resources
  for insert to authenticated with check (auth.uid() = uploader_id);

create policy "resources_delete_own_or_admin" on public.resources
  for delete to authenticated using (auth.uid() = uploader_id or public.is_admin());

-- ── Trigger: auto-create profile on sign-up ──────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, ops_name, appointment, is_admin)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'ops_name',
    new.raw_user_meta_data->>'appointment',
    coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Storage bucket for file resources ────────────────────
insert into storage.buckets (id, name, public) values ('resources', 'resources', false)
  on conflict do nothing;

create policy "storage_select" on storage.objects
  for select to authenticated using (bucket_id = 'resources');

create policy "storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'resources');

create policy "storage_delete_own_or_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resources' and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_admin()
  ));
