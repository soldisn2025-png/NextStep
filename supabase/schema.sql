create extension if not exists "pgcrypto";

create table if not exists public.user_plan_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_state jsonb not null default '{}'::jsonb,
  plan_updated_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_user_plan_snapshots_updated_at on public.user_plan_snapshots;
create trigger set_user_plan_snapshots_updated_at
before update on public.user_plan_snapshots
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.user_plan_snapshots enable row level security;

drop policy if exists "Users can read their own synced plans" on public.user_plan_snapshots;
create policy "Users can read their own synced plans"
on public.user_plan_snapshots
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own synced plans" on public.user_plan_snapshots;
create policy "Users can insert their own synced plans"
on public.user_plan_snapshots
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own synced plans" on public.user_plan_snapshots;
create policy "Users can update their own synced plans"
on public.user_plan_snapshots
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
