-- =========================================================================
-- PackCheck — PostgreSQL / Supabase Schema
-- Legal Metrology Compliance & Enforcement Intelligence Platform
-- Smart India Hackathon 2026 (Problem Statement 26034)
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users: Investigators and Consumers)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('investigator', 'consumer', 'admin')),
  organization_or_city text,
  badge_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. INSPECTIONS (Core inspection case records)
create table if not exists public.inspections (
  id text primary key default ('LM-2026-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0')),
  user_id uuid references public.profiles(id) on delete set null,
  product_name text not null,
  brand text not null,
  category text not null check (category in ('Packaged Food', 'Edible Oils', 'Cosmetics', 'Personal Care', 'Beverages', 'General Commodity')),
  status text not null default 'Review Required' check (status in ('Processing', 'Review Required', 'Verified', 'Cleared', 'Report Generated')),
  reviewer_name text default 'Officer R. Sharma',
  confidence_score integer default 95,
  evidence_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. DECLARATIONS (Mandatory declarations extracted via OCR/Vision)
create table if not exists public.declarations (
  id uuid default uuid_generate_v4() primary key,
  inspection_id text references public.inspections(id) on delete cascade not null,
  field_name text not null, -- e.g. 'Maximum Retail Price (MRP)', 'Net Quantity', 'Date of Packaging'
  observed_value text not null,
  confidence integer default 95,
  status text not null default 'verified' check (status in ('verified', 'flagged', 'missing')),
  rule_reference text,
  evidence_region text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. FINDINGS (Potential compliance issues evaluated by Rules Engine)
create table if not exists public.findings (
  id uuid default uuid_generate_v4() primary key,
  inspection_id text references public.inspections(id) on delete cascade not null,
  severity text not null check (severity in ('critical', 'warning', 'advisory', 'compliant')),
  title text not null,
  observed_value text not null,
  expected_requirement text not null,
  applicable_rule text not null,
  reason text not null,
  evidence_region text,
  confidence integer default 94,
  status text not null default 'Pending Review' check (status in ('Pending Review', 'Confirmed', 'Dismissed', 'Evidence Requested')),
  investigator_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. LEGAL METROLOGY RULES (Rule Engine statutory repository)
create table if not exists public.rules (
  id text primary key, -- e.g. 'PCR-RULE-6-1-E'
  section text not null,
  rule_name text not null,
  category text not null,
  requirement_text text not null,
  penalty_section text default 'Section 36 of Legal Metrology Act 2009',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.inspections enable row level security;
alter table public.declarations enable row level security;
alter table public.findings enable row level security;
alter table public.rules enable row level security;

-- Public read access policies for authenticated users
create policy "Allow read access to rules for all" on public.rules for select using (true);
create policy "Allow read access to inspections" on public.inspections for select using (true);
create policy "Allow insert access to inspections" on public.inspections for insert with check (true);
create policy "Allow update access to inspections" on public.inspections for update using (true);

create policy "Allow read declarations" on public.declarations for select using (true);
create policy "Allow insert declarations" on public.declarations for insert with check (true);

create policy "Allow read findings" on public.findings for select using (true);
create policy "Allow update findings" on public.findings for update using (true);
create policy "Allow insert findings" on public.findings for insert with check (true);

-- Insert Default Seed Rules (Legal Metrology Packaged Commodities Rules 2011)
insert into public.rules (id, section, rule_name, category, requirement_text, penalty_section)
values
  ('PCR-RULE-6-1-A', 'Rule 6(1)(a)', 'Manufacturer & Packer Identification', 'All Commodities', 'Every package shall bear the name and complete address of the manufacturer, or packer, or importer.', 'Section 36(1) LM Act 2009'),
  ('PCR-RULE-6-1-B', 'Rule 6(1)(b)', 'Generic / Common Name of Commodity', 'All Commodities', 'The common or generic name of the commodity contained in the package must be prominently declared.', 'Section 36(1) LM Act 2009'),
  ('PCR-RULE-6-1-C', 'Rule 6(1)(c) & Rule 7', 'Net Quantity & Numeral Font Height', 'All Commodities', 'Net quantity in terms of standard unit of weight/measure. Numeral height must comply with Schedule II minimum sizes.', 'Section 36(1) LM Act 2009'),
  ('PCR-RULE-6-1-D', 'Rule 6(1)(d)', 'Month and Year of Manufacture / Packaging', 'All Commodities', 'The month and year in which the commodity is manufactured or pre-packed or imported must be stated.', 'Section 36(1) LM Act 2009'),
  ('PCR-RULE-6-1-E', 'Rule 6(1)(e)', 'Maximum Retail Price (MRP) Declaration', 'All Commodities', 'MRP inclusive of all taxes in format: MRP Rs. xx.xx or Maximum Retail Price Rs. xx.xx (incl. of all taxes).', 'Section 36(2) LM Act 2009'),
  ('PCR-RULE-6-1-H', 'Rule 6(1)(h)', 'Consumer Care Grievance Details', 'All Commodities', 'Name, address, telephone number and email address of person/office to contact in case of consumer complaints.', 'Section 36(1) LM Act 2009'),
  ('PCR-RULE-6-1-M', 'Rule 6(1)(m)', 'Unit Sale Price (USP)', 'Pre-packaged', 'Unit sale price declared in rupees per gram/kg/litre/meter to enable fair price comparisons.', 'Section 36(1) LM Act 2009')
on conflict (id) do nothing;
