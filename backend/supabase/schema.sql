-- ================================================================
-- LinkGuard AI — Supabase / PostgreSQL Schema
-- Run this in your Supabase project SQL editor
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────────
-- Mirrors auth.users, extended with app-specific fields
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  plan        text not null default 'free' check (plan in ('free','pro','team')),
  scan_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── scan_results ──────────────────────────────────────────────────
create table if not exists public.scan_results (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references public.profiles(id) on delete set null,
  url                   text not null,
  verdict               text not null check (verdict in ('safe','suspicious','dangerous')),
  threat_type           text not null check (threat_type in ('phishing','honeytrap','scam','malware','clean','unknown')),
  confidence            numeric(5,4) not null,          -- 0.0000 – 1.0000
  threat_score          smallint not null,               -- 0 – 100
  explanation           text not null,
  signals               jsonb not null default '[]',
  model_used            text not null check (model_used in ('basic','advanced')),
  duration_ms           integer not null,
  google_safe_browsing  boolean not null default false,
  virustotal_detections integer,                         -- null = not checked
  domain_age_days       integer,                         -- null = unknown
  redirect_count        smallint not null default 0,
  scanned_at            timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists idx_scan_results_user_id    on public.scan_results(user_id);
create index if not exists idx_scan_results_scanned_at on public.scan_results(scanned_at desc);
create index if not exists idx_scan_results_verdict    on public.scan_results(verdict);
create index if not exists idx_scan_results_url_hash   on public.scan_results using hash(url);

-- ── threat_feed ───────────────────────────────────────────────────
-- Known-bad URL blocklist synced from external intel feeds
create table if not exists public.threat_feed (
  id          bigserial primary key,
  url         text unique not null,
  source      text not null,              -- 'phishtank' | 'urlhaus' | 'manual'
  threat_type text not null,
  added_at    timestamptz not null default now(),
  expires_at  timestamptz
);

create index if not exists idx_threat_feed_url on public.threat_feed using hash(url);

-- ── Row Level Security ────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.scan_results enable row level security;
alter table public.threat_feed  enable row level security;

-- profiles: users can read/update only their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- scan_results: users can only see their own scans
create policy "scans_select_own" on public.scan_results
  for select using (auth.uid() = user_id);

-- scan_results: insert allowed for any authenticated user (service role bypasses)
create policy "scans_insert_auth" on public.scan_results
  for insert with check (true);   -- backend uses service role key

-- threat_feed: read-only for all authenticated users
create policy "threat_feed_select" on public.threat_feed
  for select using (auth.role() = 'authenticated');

-- ── Helpful views ─────────────────────────────────────────────────
create or replace view public.scan_stats as
select
  user_id,
  count(*)                                                                        as total_scans,
  count(*) filter (where verdict = 'safe')                                        as safe_count,
  count(*) filter (where verdict = 'suspicious')                                  as suspicious_count,
  count(*) filter (where verdict = 'dangerous')                                   as dangerous_count,
  round(avg(confidence)::numeric, 3)                                              as avg_confidence,
  round(avg(duration_ms)::numeric, 0)                                             as avg_duration_ms
from public.scan_results
group by user_id;
