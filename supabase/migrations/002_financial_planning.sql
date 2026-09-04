-- Run after 001_initial_schema.sql in the Supabase SQL Editor.
alter table public.profiles
  add column if not exists currency text not null default 'PHP',
  add column if not exists date_format text not null default 'MMM d, yyyy',
  add column if not exists theme text not null default 'light',
  add column if not exists dashboard_period text not null default 'month';

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('Food','Transportation','Shopping','Bills','Entertainment','Health','Education','Travel','Other')),
  month date not null,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, month),
  check (month = date_trunc('month', month)::date)
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  title text not null,
  amount numeric(14,2) not null check (amount > 0),
  category text,
  source text,
  payment_method text,
  description text not null default '',
  frequency text not null check (frequency in ('daily','weekly','monthly','yearly')),
  next_run_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'expense' and category is not null and payment_method is not null) or (type = 'income' and source is not null))
);

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text not null,
  action text not null,
  affected_user_id uuid,
  affected_user_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.expenses add column if not exists recurring_id uuid references public.recurring_transactions(id) on delete set null;
alter table public.income add column if not exists recurring_id uuid references public.recurring_transactions(id) on delete set null;
create unique index if not exists expenses_recurring_run_idx on public.expenses (recurring_id, transaction_date);
create unique index if not exists income_recurring_run_idx on public.income (recurring_id, transaction_date);

create index if not exists expenses_user_category_date_idx on public.expenses (user_id, category, transaction_date desc);
create index if not exists income_user_source_date_idx on public.income (user_id, source, transaction_date desc);
create index if not exists budgets_user_month_idx on public.budgets (user_id, month);
create index if not exists recurring_due_idx on public.recurring_transactions (active, next_run_date);
create index if not exists audit_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists profiles_created_idx on public.profiles (created_at desc);

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at before update on public.budgets for each row execute function public.set_updated_at();
drop trigger if exists recurring_set_updated_at on public.recurring_transactions;
create trigger recurring_set_updated_at before update on public.recurring_transactions for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.admin_audit_logs enable row level security;
revoke all on table public.budgets, public.recurring_transactions, public.admin_audit_logs from anon, authenticated;
grant all on table public.budgets, public.recurring_transactions, public.admin_audit_logs to service_role;
grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;

notify pgrst, 'reload schema';
