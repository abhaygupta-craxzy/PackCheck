-- =========================================================================
-- PackCheck — Production Database Migration (001)
-- Legal Metrology Compliance & Enforcement Intelligence Platform
-- Smart India Hackathon 2026 (Problem Statement 26034)
-- =========================================================================

-- Enable required PostgreSQL extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. ENUM TYPES
-- =========================================================================

create type public.user_role_type as enum (
  'consumer',
  'investigator',
  'supervisor',
  'admin'
);

create type public.jurisdiction_level_type as enum (
  'central',
  'state',
  'district'
);

create type public.inspection_status_type as enum (
  'draft',
  'processing',
  'review_required',
  'verified',
  'cleared',
  'non_compliant',
  'report_generated'
);

create type public.inspection_source_type as enum (
  'physical_inspection',
  'ecommerce_listing',
  'citizen_report',
  'batch_audit'
);

create type public.evidence_asset_type as enum (
  'package_front',
  'package_back',
  'package_side',
  'ecommerce_screenshot',
  'lab_certificate',
  'invoice_receipt'
);

create type public.ocr_processing_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create type public.declaration_field_type as enum (
  'mrp',
  'net_quantity',
  'unit_sale_price',
  'mfg_date',
  'expiry_date',
  'best_before_date',
  'manufacturer_details',
  'packer_details',
  'importer_details',
  'country_of_origin',
  'consumer_care_contact',
  'generic_name',
  'ingredients_list',
  'nutritional_info',
  'custom_declaration'
);

create type public.declaration_validation_status as enum (
  'pending',
  'valid',
  'flagged',
  'missing'
);

create type public.finding_severity_type as enum (
  'critical',
  'warning',
  'advisory',
  'compliant'
);

create type public.investigator_decision_type as enum (
  'pending_review',
  'confirmed_violation',
  'dismissed',
  'evidence_requested',
  'escalated'
);

create type public.audit_action_type as enum (
  'created',
  'updated',
  'verified',
  'dismissed',
  'evidence_uploaded',
  'docket_generated',
  'deleted'
);

-- =========================================================================
-- 2. ORGANIZATIONS & ENFORCEMENT JURISDICTIONS
-- =========================================================================

create table if not exists public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  jurisdiction_level public.jurisdiction_level_type not null default 'state',
  state_code text not null, -- e.g. 'MH', 'DL', 'KA'
  district_name text,
  office_address text,
  nodal_officer_name text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 3. PROFILES (Users synced with auth.users)
-- =========================================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text not null,
  role public.user_role_type not null default 'consumer',
  organization_id uuid references public.organizations(id) on delete set null,
  badge_number text,
  designation text,
  phone_number text,
  avatar_url text,
  is_verified boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 4. INSPECTION CASES
-- =========================================================================

create sequence if not exists public.inspection_case_seq start 1001;

create table if not exists public.inspections (
  id uuid default gen_random_uuid() primary key,
  case_number text unique not null default ('LM-2026-' || nextval('public.inspection_case_seq')::text),
  title text not null,
  product_name text not null,
  brand text not null,
  category text not null, -- e.g. 'Packaged Food', 'Edible Oils', 'Cosmetics', 'Electronics'
  source_type public.inspection_source_type not null default 'physical_inspection',
  marketplace_url text,
  status public.inspection_status_type not null default 'review_required',
  created_by uuid references public.profiles(id) on delete set null,
  assigned_investigator_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  location_coordinates jsonb, -- e.g. {"lat": 19.0760, "lng": 72.8777, "city": "Mumbai"}
  overall_confidence_score numeric(5, 2), -- computed AI confidence percentage
  is_public_citizen_check boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 5. PACKAGE SCANS & EVIDENCE ASSETS
-- =========================================================================

create table if not exists public.package_scans (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  asset_type public.evidence_asset_type not null default 'package_front',
  storage_path text not null, -- bucket storage path
  public_url text,
  file_size_bytes bigint,
  mime_type text default 'image/jpeg',
  image_dimensions jsonb, -- {"width": 1920, "height": 1080}
  ocr_status public.ocr_processing_status not null default 'pending',
  raw_ocr_payload jsonb, -- full OCR token stream with text & bounding boxes
  scan_metadata jsonb, -- device info, capture timestamp, hashes
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 6. EXTRACTED DECLARATIONS
-- =========================================================================

create table if not exists public.declarations (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  scan_id uuid references public.package_scans(id) on delete set null,
  field_type public.declaration_field_type not null,
  label_text text not null, -- Display label e.g. "Maximum Retail Price (MRP)"
  raw_extracted_value text not null,
  normalized_value text,
  confidence_score numeric(5, 2),
  evidence_bounding_box jsonb, -- {"x": 120, "y": 450, "w": 300, "h": 80, "unit": "px"}
  validation_status public.declaration_validation_status not null default 'pending',
  is_human_verified boolean not null default false,
  verified_value text,
  verified_by uuid references public.profiles(id) on delete set null,
  rule_reference text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 7. STATUTORY RULES & RULE VERSIONS (Legal Metrology Repository)
-- =========================================================================

create table if not exists public.rules (
  id text primary key, -- e.g. 'PCR-2011-RULE-6-1-E'
  rule_code text not null,
  act_title text not null default 'Legal Metrology Act, 2009',
  subordinate_rule text not null default 'Legal Metrology (Packaged Commodities) Rules, 2011',
  section_ref text not null, -- e.g. 'Rule 6(1)(e)'
  rule_title text not null,
  requirement_description text not null,
  category_applicability text[] not null default array['All Commodities'],
  penalty_section text default 'Section 36(1) of Legal Metrology Act, 2009',
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.rule_versions (
  id uuid default gen_random_uuid() primary key,
  rule_id text references public.rules(id) on delete cascade not null,
  version_number text not null, -- e.g. '2022-Amendment-GSR-711-E'
  amendment_title text not null,
  effective_from date not null,
  effective_until date,
  amendment_details jsonb, -- exact parameter tables (e.g. font size minimum thresholds)
  gazette_notification_ref text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 8. COMPLIANCE FINDINGS
-- =========================================================================

create table if not exists public.findings (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  rule_id text references public.rules(id) on delete set null,
  rule_version_id uuid references public.rule_versions(id) on delete set null,
  declaration_id uuid references public.declarations(id) on delete set null,
  severity public.finding_severity_type not null default 'warning',
  title text not null,
  observed_value_summary text not null,
  statutory_requirement text not null,
  violation_reason text not null,
  evidence_region_summary text,
  ai_confidence_score numeric(5, 2),
  investigator_decision public.investigator_decision_type not null default 'pending_review',
  investigator_notes text,
  decided_by uuid references public.profiles(id) on delete set null,
  decision_timestamp timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 9. EVIDENCE ANNOTATIONS & TRACEABILITY
-- =========================================================================

create table if not exists public.evidence_annotations (
  id uuid default gen_random_uuid() primary key,
  finding_id uuid references public.findings(id) on delete cascade not null,
  scan_id uuid references public.package_scans(id) on delete cascade not null,
  bounding_box jsonb not null, -- {"x": 100, "y": 200, "w": 250, "h": 75}
  ocr_token_indices integer[],
  extracted_snippet text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 10. INSPECTION REPORTS & DOCKETS
-- =========================================================================

create table if not exists public.inspection_reports (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  report_number text unique not null,
  generated_by uuid references public.profiles(id) on delete set null,
  verdict_summary text not null,
  findings_snapshot jsonb not null,
  evidence_snapshot jsonb not null,
  formal_notice_draft text,
  pdf_storage_path text,
  is_finalized boolean not null default false,
  finalized_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 11. AUDIT LOGS (Immutable Compliance Audit Trail)
-- =========================================================================

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null, -- 'inspections', 'findings', 'declarations', 'reports'
  entity_id text not null,
  action public.audit_action_type not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  previous_state jsonb,
  new_state jsonb,
  client_ip text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 12. PERFORMANCE INDEXES
-- =========================================================================

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_organization on public.profiles(organization_id);

create index if not exists idx_inspections_status on public.inspections(status);
create index if not exists idx_inspections_category on public.inspections(category);
create index if not exists idx_inspections_created_by on public.inspections(created_by);
create index if not exists idx_inspections_assigned on public.inspections(assigned_investigator_id);
create index if not exists idx_inspections_created_at on public.inspections(created_at desc);

create index if not exists idx_scans_inspection on public.package_scans(inspection_id);
create index if not exists idx_declarations_inspection on public.declarations(inspection_id);
create index if not exists idx_findings_inspection on public.findings(inspection_id);
create index if not exists idx_findings_decision on public.findings(investigator_decision);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);

-- =========================================================================
-- 13. AUTOMATED DATABASE TRIGGERS
-- =========================================================================

-- Trigger to auto-update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_inspections_updated_at before update on public.inspections
for each row execute function public.set_updated_at();

create trigger trg_declarations_updated_at before update on public.declarations
for each row execute function public.set_updated_at();

create trigger trg_findings_updated_at before update on public.findings
for each row execute function public.set_updated_at();

-- Trigger to automatically create profile entry when new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role public.user_role_type;
  user_full_name text;
begin
  user_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role_type, 'consumer');
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, user_full_name, user_role)
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Trigger to log finding investigator decisions to immutable audit trail
create or replace function public.audit_finding_decision()
returns trigger as $$
begin
  if (old.investigator_decision is distinct from new.investigator_decision) then
    insert into public.audit_logs (
      entity_type,
      entity_id,
      action,
      actor_id,
      previous_state,
      new_state
    ) values (
      'findings',
      new.id::text,
      'updated',
      auth.uid(),
      jsonb_build_object('decision', old.investigator_decision, 'notes', old.investigator_notes),
      jsonb_build_object('decision', new.investigator_decision, 'notes', new.investigator_notes)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_audit_finding_decision
after update on public.findings
for each row execute function public.audit_finding_decision();

-- =========================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.inspections enable row level security;
alter table public.package_scans enable row level security;
alter table public.declarations enable row level security;
alter table public.rules enable row level security;
alter table public.rule_versions enable row level security;
alter table public.findings enable row level security;
alter table public.evidence_annotations enable row level security;
alter table public.inspection_reports enable row level security;
alter table public.audit_logs enable row level security;

-- Helper security functions
create or replace function public.get_current_user_role()
returns public.user_role_type as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_authorized_enforcer()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('investigator', 'supervisor', 'admin')
  );
$$ language sql stable security definer;

-- PROFILES POLICIES
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Enforcers can view colleague profiles in same org"
  on public.profiles for select
  using (
    public.is_authorized_enforcer()
    and organization_id = (select organization_id from public.profiles where id = auth.uid())
  );

-- RULES POLICIES (Public read access for transparency, write restricted to admin)
create policy "Rules are publicly readable"
  on public.rules for select
  using (true);

create policy "Rule versions are publicly readable"
  on public.rule_versions for select
  using (true);

create policy "Rules manageable only by admins"
  on public.rules for all
  using (public.get_current_user_role() = 'admin');

-- INSPECTIONS POLICIES
create policy "Citizens can view own inspections or public checks"
  on public.inspections for select
  using (
    auth.uid() = created_by
    or is_public_citizen_check = true
  );

create policy "Citizens can create public inspections"
  on public.inspections for insert
  with check (auth.uid() = created_by or auth.uid() is null);

create policy "Investigators can view organizational inspection dockets"
  on public.inspections for select
  using (
    public.is_authorized_enforcer()
    and (
      organization_id = (select organization_id from public.profiles where id = auth.uid())
      or assigned_investigator_id = auth.uid()
      or created_by = auth.uid()
      or organization_id is null
    )
  );

create policy "Investigators can create and update inspections"
  on public.inspections for insert
  with check (public.is_authorized_enforcer() or auth.uid() = created_by);

create policy "Investigators can update assigned inspections"
  on public.inspections for update
  using (
    public.is_authorized_enforcer()
    and (
      assigned_investigator_id = auth.uid()
      or organization_id = (select organization_id from public.profiles where id = auth.uid())
      or created_by = auth.uid()
    )
  );

-- DECLARATIONS, SCANS, FINDINGS POLICIES (Linked to parent inspection permissions)
create policy "Read declarations permitted with inspection access"
  on public.declarations for select
  using (
    exists (
      select 1 from public.inspections i
      where i.id = declarations.inspection_id
      and (
        i.created_by = auth.uid()
        or i.is_public_citizen_check = true
        or public.is_authorized_enforcer()
      )
    )
  );

create policy "Insert declarations allowed for inspection creator/investigator"
  on public.declarations for insert
  with check (
    exists (
      select 1 from public.inspections i
      where i.id = declarations.inspection_id
      and (i.created_by = auth.uid() or public.is_authorized_enforcer())
    )
  );

create policy "Update declarations allowed for investigators"
  on public.declarations for update
  using (public.is_authorized_enforcer());

create policy "Read findings permitted with inspection access"
  on public.findings for select
  using (
    exists (
      select 1 from public.inspections i
      where i.id = findings.inspection_id
      and (
        i.created_by = auth.uid()
        or i.is_public_citizen_check = true
        or public.is_authorized_enforcer()
      )
    )
  );

create policy "Update findings decision permitted for investigators"
  on public.findings for update
  using (public.is_authorized_enforcer());

create policy "Package scans readable with inspection access"
  on public.package_scans for select
  using (
    exists (
      select 1 from public.inspections i
      where i.id = package_scans.inspection_id
      and (
        i.created_by = auth.uid()
        or i.is_public_citizen_check = true
        or public.is_authorized_enforcer()
      )
    )
  );

create policy "Package scans insertable by case creator or investigator"
  on public.package_scans for insert
  with check (
    exists (
      select 1 from public.inspections i
      where i.id = package_scans.inspection_id
      and (i.created_by = auth.uid() or public.is_authorized_enforcer())
    )
  );

-- REPORTS POLICIES
create policy "Reports readable by authorized investigators or case owner"
  on public.inspection_reports for select
  using (
    public.is_authorized_enforcer()
    or exists (
      select 1 from public.inspections i
      where i.id = inspection_reports.inspection_id
      and i.created_by = auth.uid()
    )
  );

create policy "Reports manageable by investigators"
  on public.inspection_reports for all
  using (public.is_authorized_enforcer());

-- AUDIT LOGS POLICIES (Strict read-only for enforcement leadership)
create policy "Audit logs readable by supervisors and investigators"
  on public.audit_logs for select
  using (public.is_authorized_enforcer());
