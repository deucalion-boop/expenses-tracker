-- Run this file once in the Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null check (category in (
    'Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment',
    'Health', 'Education', 'Travel', 'Other'
  )),
  description text not null default '',
  transaction_date date not null,
  payment_method text not null check (payment_method in (
    'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Other'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  source text not null check (source in (
    'Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Gift', 'Other'
  )),
  description text not null default '',
  transaction_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  allow_registration boolean not null default true,
  support_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (true)
on conflict (id) do nothing;

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, transaction_date desc);
create index if not exists income_user_date_idx
  on public.income (user_id, transaction_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists income_set_updated_at on public.income;
create trigger income_set_updated_at before update on public.income
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Add profiles for Auth users that existed before this migration.
insert into public.profiles (id, name, email)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data ->> 'name'), ''), split_part(email, '@', 1)),
  lower(email)
from auth.users
where email is not null
on conflict (id) do nothing;

-- Preserve the administrator account created during setup.
update public.profiles
set role = 'admin', status = 'active'
where lower(email) in ('admin@ledgerflow.local', 'admin@spendwise.local');

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
alter table public.app_settings enable row level security;

-- Application tables are accessed only by the Express backend using its secret key.
revoke all on table public.profiles, public.expenses, public.income, public.app_settings from anon, authenticated;
grant all on table public.profiles, public.expenses, public.income, public.app_settings to service_role;
