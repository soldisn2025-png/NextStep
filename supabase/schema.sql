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

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sms_phone text,
  sms_opt_in boolean not null default false,
  time_zone text not null default 'America/New_York',
  sms_opted_in_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists set_user_notification_preferences_updated_at on public.user_notification_preferences;
create trigger set_user_notification_preferences_updated_at
before update on public.user_notification_preferences
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.user_notification_preferences enable row level security;

drop policy if exists "Users can read their own notification preferences" on public.user_notification_preferences;
create policy "Users can read their own notification preferences"
on public.user_notification_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notification preferences" on public.user_notification_preferences;
create policy "Users can insert their own notification preferences"
on public.user_notification_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notification preferences" on public.user_notification_preferences;
create policy "Users can update their own notification preferences"
on public.user_notification_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.reminder_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null check (channel in ('sms')),
  action_id text not null,
  follow_up_date date not null,
  reminder_lead_days integer not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, channel, action_id, follow_up_date, reminder_lead_days)
);

alter table public.reminder_delivery_log enable row level security;

drop policy if exists "Users can read their own delivery log" on public.reminder_delivery_log;
create policy "Users can read their own delivery log"
on public.reminder_delivery_log
for select
using (auth.uid() = user_id);
