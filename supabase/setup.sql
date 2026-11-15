-- Owner Supabase Auth user UUID. Keep this matched to your Auth account.

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  stitches text not null,
  hoop_size text not null,
  art text not null default '🧵',
  color text not null default '#E4E9D8',
  object_path text not null unique,
  created_at timestamptz not null default now()
);

alter table public.patterns enable row level security;

grant select on public.patterns to anon, authenticated;
grant insert, update, delete on public.patterns to authenticated;

drop policy if exists "Anyone can view published patterns" on public.patterns;
create policy "Anyone can view published patterns"
  on public.patterns for select
  to anon, authenticated
  using (true);

drop policy if exists "Only the owner can add patterns" on public.patterns;
create policy "Only the owner can add patterns"
  on public.patterns for insert
  to authenticated
  with check (auth.uid() = 'REPLACE_WITH_OWNER_USER_UUID'::uuid);

drop policy if exists "Only the owner can edit patterns" on public.patterns;
create policy "Only the owner can edit patterns"
  on public.patterns for update
  to authenticated
  using (auth.uid() = 'REPLACE_WITH_OWNER_USER_UUID'::uuid)
  with check (auth.uid() = 'REPLACE_WITH_OWNER_USER_UUID'::uuid);

drop policy if exists "Only the owner can delete patterns" on public.patterns;
create policy "Only the owner can delete patterns"
  on public.patterns for delete
  to authenticated
  using (auth.uid() = 'REPLACE_WITH_OWNER_USER_UUID'::uuid);

insert into storage.buckets (id, name, public)
values ('patterns', 'patterns', true)
on conflict (id) do update set public = true;

drop policy if exists "Only the owner can upload pattern files" on storage.objects;
create policy "Only the owner can upload pattern files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'patterns'
    and (storage.foldername(name))[1] = 'REPLACE_WITH_OWNER_USER_UUID'
    and auth.uid() = 'REPLACE_WITH_OWNER_USER_UUID'::uuid
  );

drop policy if exists "Only the owner can delete pattern files" on storage.objects;
create policy "Only the owner can delete pattern files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'patterns'
    and (storage.foldername(name))[1] = 'REPLACE_WITH_OWNER_USER_UUID'
    and auth.uid() = 'REPLACE_WITH_OWNER_USER_UUID'::uuid
  );
