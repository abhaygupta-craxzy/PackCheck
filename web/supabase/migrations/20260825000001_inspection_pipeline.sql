-- =========================================================================
-- PackCheck — Inspection Pipeline Schema Extension (Migration 002)
-- AI Inspection Engine: images → OCR → extraction → compliance → report
-- Smart India Hackathon 2026 (Problem Statement 26034)
-- =========================================================================

-- Inspection processing status
create type public.processing_status_type as enum (
  'draft',
  'uploading',
  'processing',
  'ocr_complete',
  'extraction_complete',
  'compliance_analysis_complete',
  'review_required',
  'review_in_progress',
  'report_draft',
  'finalized'
);

-- Evidence source type
create type public.evidence_source_type as enum (
  'physical_package',
  'ecommerce_listing',
  'lab_certificate',
  'invoice'
);

-- OCR engine type
create type public.ocr_engine_type as enum (
  'gemini_vision',
  'paddleocr',
  'tesseract',
  'manual'
);

-- Extraction field types matching Legal Metrology declarations
create type public.field_name_type as enum (
  'product_name',
  'generic_name',
  'manufacturer_name',
  'manufacturer_address',
  'packer_name',
  'packer_address',
  'importer_name',
  'importer_address',
  'brand_name',
  'country_of_origin',
  'net_quantity',
  'net_quantity_unit',
  'mrp',
  'mrp_currency',
  'manufacturing_date',
  'packing_date',
  'expiry_date',
  'best_before_date',
  'batch_number',
  'lot_number',
  'consumer_care_name',
  'consumer_care_address',
  'consumer_care_phone',
  'consumer_care_email',
  'number_of_units',
  'unit_sale_price',
  'fssai_license',
  'ingredients_list',
  'nutritional_info',
  'other'
);

-- Extraction confidence levels
create type public.confidence_level_type as enum (
  'high',
  'medium',
  'low',
  'not_detected'
);

-- Compliance finding status
create type public.finding_status_type as enum (
  'pass',
  'potential_non_compliance',
  'not_detected',
  'not_determinable',
  'not_applicable',
  'requires_review'
);

-- Review decision
create type public.review_decision_type as enum (
  'pending',
  'confirmed_violation',
  'accepted_compliant',
  'rejected',
  'needs_further_inspection',
  'dismissed'
);

-- Report block type
create type public.report_block_type as enum (
  'header',
  'inspection_info',
  'product_info',
  'declaration_table',
  'finding',
  'evidence',
  'observation',
  'measurement',
  'conclusion',
  'signature',
  'appendix'
);

-- =========================================================================
-- INSPECTION IMAGES (Evidence uploads)
-- =========================================================================

create table if not exists public.inspection_images (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  storage_bucket text not null default 'evidence',
  storage_path text not null,
  public_url text,
  original_filename text,
  file_size_bytes bigint,
  mime_type text default 'image/jpeg',
  image_type text not null default 'front',  -- front, back, side, close_up, ecommerce
  width_px integer,
  height_px integer,
  -- Quality analysis results
  quality_score numeric(4,2),
  quality_status text,  -- good, acceptable, poor
  quality_warnings text[],
  -- Preprocessing
  preprocessing_applied text[],
  processed_storage_path text,
  -- OCR status
  ocr_status public.ocr_engine_type,
  ocr_completed_at timestamp with time zone,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- OCR RESULTS (Raw OCR tokens with bounding boxes)
-- =========================================================================

create table if not exists public.ocr_results (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.inspection_images(id) on delete cascade not null,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  ocr_engine public.ocr_engine_type not null default 'gemini_vision',
  engine_version text,
  -- All OCR tokens as JSONB array
  -- [{id, text, confidence, bbox: {x1,y1,x2,y2}, line_id, region_id}]
  tokens jsonb not null default '[]',
  -- Full concatenated text
  full_text text,
  -- Overall confidence
  overall_confidence numeric(4,2),
  -- Processing metadata
  processing_time_ms integer,
  model_used text,
  raw_response jsonb,  -- full model response for debugging
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- EXTRACTED FIELDS (Structured declarations from OCR)
-- =========================================================================

create table if not exists public.extracted_fields (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  image_id uuid references public.inspection_images(id) on delete set null,
  -- Field identification
  field_name public.field_name_type not null,
  field_label text not null,  -- Human-readable label e.g. "Maximum Retail Price (MRP)"
  -- AI extracted values
  raw_value text,             -- Exactly as extracted
  normalized_value text,      -- Normalized form e.g. "249.00" from "₹249/-"
  -- Confidence
  confidence_score numeric(4,2),
  confidence_level public.confidence_level_type not null default 'medium',
  -- Evidence linkage
  ocr_token_ids text[],       -- IDs of OCR tokens that contributed
  bounding_box jsonb,         -- {x1, y1, x2, y2, image_width, image_height}
  source_text text,           -- Verbatim OCR text used
  -- Status
  extraction_status text not null default 'ai_extracted',  -- ai_extracted, human_corrected, manual_entry, not_detected
  review_status text not null default 'pending',           -- pending, accepted, rejected
  -- Human correction
  is_human_corrected boolean not null default false,
  corrected_value text,
  corrected_by uuid references public.profiles(id) on delete set null,
  corrected_at timestamp with time zone,
  correction_reason text,
  original_ai_value text,  -- Never overwrite, keep for audit
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- EVIDENCE ITEMS (Linked evidence crops/regions per finding)
-- =========================================================================

create table if not exists public.evidence_items (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  image_id uuid references public.inspection_images(id) on delete cascade not null,
  field_id uuid references public.extracted_fields(id) on delete set null,
  -- Evidence details
  evidence_label text not null,
  ocr_text text,
  ocr_confidence numeric(4,2),
  bounding_box jsonb,  -- {x1, y1, x2, y2}
  crop_storage_path text,  -- cropped region image
  crop_public_url text,
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- RULE EVALUATIONS (Per-rule deterministic evaluation results)
-- =========================================================================

create table if not exists public.rule_evaluations (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  rule_id text references public.rules(id) on delete set null,
  field_id uuid references public.extracted_fields(id) on delete set null,
  -- Evaluation result
  status public.finding_status_type not null,
  observed_value text,
  expected_requirement text not null,
  explanation text not null,
  -- Confidence
  confidence_score numeric(4,2),
  requires_human_review boolean not null default false,
  -- Evidence
  evidence_item_ids uuid[],
  -- Metadata
  ruleset_version text default 'PCR-India-2026',
  evaluated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- COMPLIANCE FINDINGS V2 (Replaces mock data, real pipeline findings)
-- =========================================================================

create table if not exists public.pipeline_findings (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  rule_evaluation_id uuid references public.rule_evaluations(id) on delete set null,
  rule_id text references public.rules(id) on delete set null,
  field_id uuid references public.extracted_fields(id) on delete set null,
  -- Finding details
  finding_number text not null,  -- e.g. F-001
  category text not null,        -- MRP, Manufacturer, Net Quantity, etc.
  severity public.finding_severity_type not null default 'warning',
  status public.finding_status_type not null,
  title text not null,
  observed_value text,
  expected_requirement text not null,
  explanation text not null,
  evidence_item_ids uuid[],
  -- AI metadata
  ai_confidence_score numeric(4,2),
  ruleset_version text default 'PCR-India-2026',
  -- Investigator review
  review_decision public.review_decision_type not null default 'pending',
  investigator_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- MANUAL MEASUREMENTS (Physical measurements by investigator)
-- =========================================================================

create table if not exists public.manual_measurements (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  measurement_type text not null,  -- net_quantity, font_height, package_dimension
  declared_value text,
  declared_unit text,
  measured_value numeric(10,3),
  measured_unit text,
  mpe_value numeric(10,3),
  mpe_unit text,
  deficiency numeric(10,3),
  result text,  -- pass, potential_non_compliance, not_determinable
  method text,
  notes text,
  measured_by uuid references public.profiles(id) on delete set null,
  measured_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- REPORTS V2 (Full inspection reports)
-- =========================================================================

create table if not exists public.pipeline_reports (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  report_number text unique not null,
  title text not null,
  -- Metadata
  generated_by uuid references public.profiles(id) on delete set null,
  ruleset_version text default 'PCR-India-2026',
  -- Summary
  total_checks integer default 0,
  passed_count integer default 0,
  potential_issues_count integer default 0,
  not_determinable_count integer default 0,
  not_applicable_count integer default 0,
  requires_review_count integer default 0,
  overall_status text default 'requires_investigator_review',
  -- Report content (block-based)
  blocks jsonb not null default '[]',
  -- Product snapshot
  product_snapshot jsonb,
  -- Finalization
  is_draft boolean not null default true,
  is_finalized boolean not null default false,
  finalized_by uuid references public.profiles(id) on delete set null,
  finalized_at timestamp with time zone,
  -- Exports
  pdf_storage_path text,
  pdf_generated_at timestamp with time zone,
  -- Version
  version integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- INSPECTION PROCESSING STATUS LOG (Real-time pipeline progress)
-- =========================================================================

create table if not exists public.processing_events (
  id uuid default gen_random_uuid() primary key,
  inspection_id uuid references public.inspections(id) on delete cascade not null,
  stage text not null,  -- quality_check, ocr, extraction, compliance, report
  status text not null, -- started, completed, failed, skipped
  message text,
  metadata jsonb,
  duration_ms integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- INDEXES
-- =========================================================================

create index if not exists idx_inspection_images_inspection on public.inspection_images(inspection_id);
create index if not exists idx_ocr_results_image on public.ocr_results(image_id);
create index if not exists idx_ocr_results_inspection on public.ocr_results(inspection_id);
create index if not exists idx_extracted_fields_inspection on public.extracted_fields(inspection_id);
create index if not exists idx_extracted_fields_name on public.extracted_fields(field_name);
create index if not exists idx_evidence_items_inspection on public.evidence_items(inspection_id);
create index if not exists idx_rule_evaluations_inspection on public.rule_evaluations(inspection_id);
create index if not exists idx_pipeline_findings_inspection on public.pipeline_findings(inspection_id);
create index if not exists idx_pipeline_findings_review on public.pipeline_findings(review_decision);
create index if not exists idx_pipeline_reports_inspection on public.pipeline_reports(inspection_id);
create index if not exists idx_processing_events_inspection on public.processing_events(inspection_id);

-- =========================================================================
-- AUTO-UPDATE TRIGGERS
-- =========================================================================

create trigger trg_extracted_fields_updated_at before update on public.extracted_fields
for each row execute function public.set_updated_at();

create trigger trg_pipeline_findings_updated_at before update on public.pipeline_findings
for each row execute function public.set_updated_at();

create trigger trg_pipeline_reports_updated_at before update on public.pipeline_reports
for each row execute function public.set_updated_at();

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

alter table public.inspection_images enable row level security;
alter table public.ocr_results enable row level security;
alter table public.extracted_fields enable row level security;
alter table public.evidence_items enable row level security;
alter table public.rule_evaluations enable row level security;
alter table public.pipeline_findings enable row level security;
alter table public.manual_measurements enable row level security;
alter table public.pipeline_reports enable row level security;
alter table public.processing_events enable row level security;

-- Investigators can access all inspection pipeline data
create policy "Investigators can read all inspection data"
  on public.inspection_images for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = inspection_images.inspection_id and (i.created_by = auth.uid() or i.is_public_citizen_check = true))
  ));

create policy "Investigators can insert images"
  on public.inspection_images for insert
  with check (public.is_authorized_enforcer() or auth.uid() = uploaded_by);

create policy "OCR results readable by enforcer or creator"
  on public.ocr_results for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = ocr_results.inspection_id and i.created_by = auth.uid())
  ));

create policy "OCR results insertable by enforcer"
  on public.ocr_results for insert
  with check (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = ocr_results.inspection_id and i.created_by = auth.uid())
  ));

create policy "Extracted fields readable by enforcer or creator"
  on public.extracted_fields for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = extracted_fields.inspection_id and (i.created_by = auth.uid() or i.is_public_citizen_check = true))
  ));

create policy "Extracted fields writable by enforcer or creator"
  on public.extracted_fields for all
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = extracted_fields.inspection_id and i.created_by = auth.uid())
  ));

create policy "Evidence items readable by enforcer or creator"
  on public.evidence_items for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = evidence_items.inspection_id and (i.created_by = auth.uid() or i.is_public_citizen_check = true))
  ));

create policy "Evidence items writable"
  on public.evidence_items for insert
  with check (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = evidence_items.inspection_id and i.created_by = auth.uid())
  ));

create policy "Rule evaluations readable"
  on public.rule_evaluations for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = rule_evaluations.inspection_id and (i.created_by = auth.uid() or i.is_public_citizen_check = true))
  ));

create policy "Rule evaluations writable by enforcer"
  on public.rule_evaluations for all
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = rule_evaluations.inspection_id and i.created_by = auth.uid())
  ));

create policy "Pipeline findings readable"
  on public.pipeline_findings for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = pipeline_findings.inspection_id and (i.created_by = auth.uid() or i.is_public_citizen_check = true))
  ));

create policy "Pipeline findings updatable by enforcer"
  on public.pipeline_findings for update
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = pipeline_findings.inspection_id and i.created_by = auth.uid())
  ));

create policy "Pipeline findings insertable"
  on public.pipeline_findings for insert
  with check (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = pipeline_findings.inspection_id and i.created_by = auth.uid())
  ));

create policy "Manual measurements by enforcer"
  on public.manual_measurements for all
  using (public.is_authorized_enforcer());

create policy "Pipeline reports readable"
  on public.pipeline_reports for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = pipeline_reports.inspection_id and i.created_by = auth.uid())
  ));

create policy "Pipeline reports writable by enforcer"
  on public.pipeline_reports for all
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = pipeline_reports.inspection_id and i.created_by = auth.uid())
  ));

create policy "Processing events readable"
  on public.processing_events for select
  using (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = processing_events.inspection_id and i.created_by = auth.uid())
  ));

create policy "Processing events writable"
  on public.processing_events for insert
  with check (public.is_authorized_enforcer() or (
    exists (select 1 from public.inspections i where i.id = processing_events.inspection_id and i.created_by = auth.uid())
  ));
