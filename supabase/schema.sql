create extension if not exists "pgcrypto";

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  default_daily_review_limit integer not null default 35 check (default_daily_review_limit between 1 and 200),
  ai_model text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  platform text not null check (platform in ('LinkedIn', 'Facebook', 'Instagram')),
  url text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  platform text not null check (platform in ('LinkedIn', 'Facebook', 'Instagram')),
  niche text not null,
  location text,
  keywords text[] not null default '{}',
  hashtags text[] not null default '{}',
  target_profile_type text,
  daily_review_limit integer not null default 35 check (daily_review_limit between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  name text not null,
  platform text not null check (platform in ('LinkedIn', 'Facebook', 'Instagram')),
  url text not null,
  niche text,
  location text,
  bio text,
  keywords_detected text[] not null default '{}',
  hashtags_related text[] not null default '{}',
  relevance_score integer not null default 0 check (relevance_score between 0 and 100),
  fit_reason text,
  approach_suggestion text,
  category text check (category in ('Alta prioridad', 'Buen encaje', 'Nutricion', 'Baja prioridad', 'No encaja')),
  status text not null default 'Nuevo' check (status in ('Nuevo', 'Guardado', 'Revisado', 'Seguido manualmente', 'Contactado', 'Descartado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, url)
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  reviewed_count integer not null default 0,
  opened_count integer not null default 0,
  followed_manual_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_social_accounts_updated_at on public.social_accounts;
create trigger set_social_accounts_updated_at
before update on public.social_accounts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute procedure public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

drop trigger if exists set_daily_activity_updated_at on public.daily_activity;
create trigger set_daily_activity_updated_at
before update on public.daily_activity
for each row execute procedure public.set_updated_at();

alter table public.user_settings enable row level security;
alter table public.social_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.daily_activity enable row level security;

create policy "Users can manage own settings" on public.user_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own social accounts" on public.social_accounts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own campaigns" on public.campaigns
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own leads" on public.leads
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own lead notes" on public.lead_notes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own daily activity" on public.daily_activity
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists campaigns_user_id_idx on public.campaigns(user_id);
create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_campaign_id_idx on public.leads(campaign_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_platform_idx on public.leads(platform);
create index if not exists daily_activity_user_date_idx on public.daily_activity(user_id, activity_date);
