create extension if not exists pgcrypto;

create table if not exists public.schedules (
  id text primary key,
  course text not null,
  title text not null,
  day text not null check (day in ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday')),
  start_time text not null,
  end_time text not null,
  room text not null,
  instructor text not null,
  section text not null
);

create table if not exists public.rooms (
  id text primary key,
  room_number text not null unique,
  type text not null check (type in ('classroom', 'lab', 'seminar')),
  capacity integer not null check (capacity > 0),
  equipment text[] not null default '{}',
  floor integer not null,
  status text not null check (status in ('available', 'unavailable')),
  bookings jsonb not null default '[]'::jsonb
);

create table if not exists public.events (
  id text primary key,
  name text not null,
  description text not null,
  date text not null,
  start_time text not null,
  end_time text not null,
  end_date text not null,
  venue text not null,
  organizer text not null,
  capacity integer not null check (capacity > 0),
  registered integer not null default 0 check (registered >= 0),
  registrations jsonb not null default '[]'::jsonb,
  status text not null check (status in ('upcoming', 'ongoing', 'completed', 'cancelled', 'full'))
);

create table if not exists public.announcements (
  id text primary key,
  title text not null,
  body text not null,
  date text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  posted_by text not null,
  expires text not null
);

create table if not exists public.assignments (
  id text primary key,
  course text not null,
  course_title text not null,
  title text not null,
  description text not null,
  assigned_date text not null,
  deadline text not null,
  submission_platform text not null,
  status text not null check (status in ('pending', 'submitted', 'graded', 'late')),
  marks integer not null check (marks >= 0)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'student' check (role in ('super_admin', 'cr', 'sr', 'student')),
  requested_role text not null default 'student' check (requested_role in ('cr', 'sr', 'student')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  section text,
  semester text,
  year text,
  created_at timestamptz not null default now()
);

create table if not exists public.pending_changes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('schedule', 'room', 'event', 'announcement', 'assignment')),
  operation text not null check (operation in ('add', 'edit', 'delete')),
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  source text not null check (source in ('ai_image', 'manual')),
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  proposed_by uuid references auth.users(id) on delete set null,
  proposer_label text not null,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_label text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested text;
begin
  requested := case
    when new.raw_user_meta_data ->> 'requested_role' in ('cr', 'sr', 'student')
      then new.raw_user_meta_data ->> 'requested_role'
    else 'student'
  end;

  insert into public.profiles (id, email, full_name, role, requested_role, status, section, semester, year)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student',
    requested,
    'pending',
    new.raw_user_meta_data ->> 'section',
    new.raw_user_meta_data ->> 'semester',
    new.raw_user_meta_data ->> 'year'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.schedules enable row level security;
alter table public.rooms enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.assignments enable row level security;
alter table public.profiles enable row level security;
alter table public.pending_changes enable row level security;
alter table public.audit_log enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['schedules', 'rooms', 'events', 'announcements', 'assignments', 'pending_changes', 'audit_log']
  loop
    execute format('drop policy if exists "Authenticated read" on public.%I', table_name);
    execute format('create policy "Authenticated read" on public.%I for select to authenticated using (true)', table_name);
  end loop;

  foreach table_name in array array['schedules', 'rooms', 'events', 'announcements', 'assignments']
  loop
    execute format('drop policy if exists "Authenticated insert" on public.%I', table_name);
    execute format('drop policy if exists "Authenticated update" on public.%I', table_name);
    execute format('drop policy if exists "Authenticated delete" on public.%I', table_name);
    execute format('create policy "Authenticated insert" on public.%I for insert to authenticated with check (true)', table_name);
    execute format('create policy "Authenticated update" on public.%I for update to authenticated using (true) with check (true)', table_name);
    execute format('create policy "Authenticated delete" on public.%I for delete to authenticated using (true)', table_name);
  end loop;
end $$;

drop policy if exists "Profile visibility" on public.profiles;
create policy "Profile visibility" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.profiles viewer
      where viewer.id = auth.uid() and viewer.role = 'super_admin' and viewer.status = 'active'
    )
  );

drop policy if exists "Super admins update profiles" on public.profiles;
create policy "Super admins update profiles" on public.profiles
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles viewer
      where viewer.id = auth.uid() and viewer.role = 'super_admin' and viewer.status = 'active'
    )
  )
  with check (true);

drop policy if exists "Authenticated propose changes" on public.pending_changes;
create policy "Authenticated propose changes" on public.pending_changes
  for insert to authenticated with check (proposed_by = auth.uid());
drop policy if exists "Authenticated review changes" on public.pending_changes;
create policy "Authenticated review changes" on public.pending_changes
  for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated write audit" on public.audit_log;
create policy "Authenticated write audit" on public.audit_log
  for insert to authenticated with check (actor_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('notices', 'notices', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public notice images" on storage.objects;
create policy "Public notice images" on storage.objects
  for select to public using (bucket_id = 'notices');
drop policy if exists "Authenticated notice uploads" on storage.objects;
create policy "Authenticated notice uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'notices');

do $$
declare
  table_name text;
begin
  foreach table_name in array array['schedules', 'rooms', 'events', 'announcements', 'assignments', 'pending_changes', 'audit_log']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;