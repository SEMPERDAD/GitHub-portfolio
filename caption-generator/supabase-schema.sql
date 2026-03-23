-- ============================================================
-- CaptionAI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Users table: one row per Clerk user
create table if not exists public.users (
  id               text        primary key,  -- Clerk userId
  tier             text        not null default 'free' check (tier in ('free', 'pro')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Daily usage table: tracks caption count per user per day
create table if not exists public.daily_usage (
  id         bigserial   primary key,
  user_id    text        not null references public.users(id) on delete cascade,
  date       date        not null default current_date,
  count      int         not null default 0,
  unique(user_id, date)
);

-- Index for fast lookups
create index if not exists daily_usage_user_date_idx
  on public.daily_usage(user_id, date);

-- Auto-update updated_at on users
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- RLS: disable public access (server-side only via service role key)
alter table public.users enable row level security;
alter table public.daily_usage enable row level security;
