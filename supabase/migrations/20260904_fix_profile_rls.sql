create or replace function public.is_active_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and status = 'active'
  );
$$;

revoke all on function public.is_active_super_admin() from public;
grant execute on function public.is_active_super_admin() to authenticated;

drop policy if exists "Profile visibility" on public.profiles;
create policy "Profile visibility" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_active_super_admin());

drop policy if exists "Super admins update profiles" on public.profiles;
create policy "Super admins update profiles" on public.profiles
  for update to authenticated
  using (public.is_active_super_admin())
  with check (true);