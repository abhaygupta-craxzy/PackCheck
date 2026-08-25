-- =========================================================================
-- PackCheck — Citizen Flags & Dynamic Reporting Migration (003)
-- Legal Metrology Compliance & Inspection Intelligence Platform
-- =========================================================================

-- 1. Add flagging columns to inspections table if not exist
alter table public.inspections
add column if not exists is_flagged boolean not null default false,
add column if not exists flagged_at timestamp with time zone,
add column if not exists flag_status text not null default 'pending_review';

-- 2. Create citizen_flags table for consumer reports to enforcement officers
create table if not exists public.citizen_flags (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade unique not null,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text not null default 'pending_review', -- 'pending_review', 'under_review', 'resolved', 'dismissed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.profiles(id) on delete set null,
  officer_notes text
);

-- 3. Enable RLS
alter table public.citizen_flags enable row level security;

-- 4. RLS Policies for citizen_flags
drop policy if exists "Allow select on citizen_flags" on public.citizen_flags;
create policy "Allow select on citizen_flags"
on public.citizen_flags for select
using (true);

drop policy if exists "Allow insert on citizen_flags" on public.citizen_flags;
create policy "Allow insert on citizen_flags"
on public.citizen_flags for insert
with check (true);

drop policy if exists "Allow update on citizen_flags" on public.citizen_flags;
create policy "Allow update on citizen_flags"
on public.citizen_flags for update
using (true);
