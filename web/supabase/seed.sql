-- =========================================================================
-- PackCheck — Statutory Rules & Reference Seed Data
-- Legal Metrology (Packaged Commodities) Rules, 2011
-- Smart India Hackathon 2026 (Problem Statement 26034)
-- =========================================================================

-- 1. SEED ORGANIZATIONS
insert into public.organizations (id, name, jurisdiction_level, state_code, district_name, office_address, contact_email)
values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Department of Legal Metrology, Maharashtra', 'state', 'MH', 'Mumbai HQ', 'Barrack No. 1, Free Church Compound, Byculla, Mumbai 400008', 'controller.lm-mh@gov.in'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Legal Metrology Enforcement Cell, Delhi NCR', 'state', 'DL', 'New Delhi', 'Vikas Bhawan, IP Estate, New Delhi 110002', 'clm-delhi@nic.in'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Central Legal Metrology Division, MoCA', 'central', 'IN', 'National Nodal', 'Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi 110001', 'legalmetrology-ca@nic.in')
on conflict (id) do nothing;

-- 2. SEED STATUTORY RULES (Legal Metrology Packaged Commodities Rules 2011)
insert into public.rules (id, rule_code, act_title, subordinate_rule, section_ref, rule_title, requirement_description, category_applicability, penalty_section)
values
  (
    'PCR-2011-RULE-6-1-A',
    'PCR-6(1)(a)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(a)',
    'Name & Complete Address of Manufacturer / Packer / Importer',
    'Every package shall bear the name and complete physical address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer, or for imported commodities, the name and address of the importer.',
    array['All Commodities', 'Packaged Food', 'Cosmetics', 'Electronics', 'Personal Care'],
    'Section 36(1) of Legal Metrology Act, 2009 (Fine up to ₹25,000 for first offence, ₹50,000 for second, up to ₹1,00,000 or imprisonment)'
  ),
  (
    'PCR-2011-RULE-6-1-B',
    'PCR-6(1)(b)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(b)',
    'Generic / Common Name of Pre-Packaged Commodity',
    'The common or generic names of the commodity contained in the package and in case of packages with more than one product, the name and quantity of each product shall be prominently declared on the Principal Display Panel (PDP).',
    array['All Commodities', 'Packaged Food', 'Edible Oils', 'Cosmetics', 'Electronics'],
    'Section 36(1) of Legal Metrology Act, 2009'
  ),
  (
    'PCR-2011-RULE-6-1-C',
    'PCR-6(1)(c)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(c) & Rule 7',
    'Net Quantity Specification & Minimum Numeral Height',
    'Net quantity in terms of standard unit of weight or measure (g, kg, ml, L, m). The height of numeral in net quantity declaration shall not be less than the minimum height specified in Schedule II based on the area of the Principal Display Panel.',
    array['All Commodities', 'Packaged Food', 'Edible Oils', 'Cosmetics', 'Beverages'],
    'Section 36(1) of Legal Metrology Act, 2009 & Schedule II'
  ),
  (
    'PCR-2011-RULE-6-1-D',
    'PCR-6(1)(d)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(d)',
    'Month and Year of Manufacture / Packaging / Pre-Packing',
    'The month and year in which the commodity is manufactured or pre-packed or imported shall be declared. Format must clearly state month in words or numerals (MM/YYYY). For commodities with best before date, month and year of expiry must also be indicated.',
    array['All Commodities', 'Packaged Food', 'Cosmetics', 'Personal Care', 'Edible Oils'],
    'Section 36(1) of Legal Metrology Act, 2009'
  ),
  (
    'PCR-2011-RULE-6-1-E',
    'PCR-6(1)(e)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(e)',
    'Maximum Retail Price (MRP) Declaration (Inclusive of All Taxes)',
    'The Maximum Retail Price (MRP) shall be declared in Indian currency with the words "Maximum or Max. Retail Price Rs. ...... / ₹ ...... inclusive of all taxes" or "MRP Rs. / ₹ ...... incl. of all taxes". No package shall be re-stickered with a higher price without statutory notification.',
    array['All Commodities', 'Packaged Food', 'Edible Oils', 'Cosmetics', 'Electronics', 'Personal Care'],
    'Section 36(2) of Legal Metrology Act, 2009 (Sale in excess of MRP)'
  ),
  (
    'PCR-2011-RULE-6-1-H',
    'PCR-6(1)(h)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(h)',
    'Consumer Grievance Redressal / Customer Care Contact Details',
    'The name, complete address, telephone number, and email address of the person or the officer who can be contacted by the consumer in case of complaints or grievance shall be distinctly declared on the package.',
    array['All Commodities', 'Packaged Food', 'Cosmetics', 'Electronics', 'Personal Care'],
    'Section 36(1) of Legal Metrology Act, 2009'
  ),
  (
    'PCR-2011-RULE-6-1-M',
    'PCR-6(1)(m)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(1)(m)',
    'Unit Sale Price (USP) Declaration',
    'Declaration of Unit Sale Price in rupees per gram/kg/ml/litre/metre on pre-packaged commodities where net quantity is more than one unit, to enable direct and transparent unit price comparison for consumers.',
    array['All Commodities', 'Packaged Food', 'Edible Oils', 'Cosmetics', 'Personal Care'],
    'Section 36(1) of Legal Metrology Act, 2009 (Mandatory from Dec 2022)'
  ),
  (
    'PCR-2011-RULE-6-10',
    'PCR-6(10)',
    'Legal Metrology Act, 2009',
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Rule 6(10)',
    'Country of Origin on Imported and E-Commerce Commodities',
    'Declaration of the Country of Origin or manufacturer country on the package and prominently on all e-commerce digital marketplace product listings.',
    array['All Commodities', 'Imported Commodities', 'E-Commerce Listings'],
    'Section 36(1) of Legal Metrology Act, 2009'
  )
on conflict (id) do nothing;

-- 3. SEED RULE VERSIONS & SCHEDULE II NUMERAL HEIGHT THRESHOLDS
insert into public.rule_versions (id, rule_id, version_number, amendment_title, effective_from, amendment_details, gazette_notification_ref)
values
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'PCR-2011-RULE-6-1-C',
    'Schedule-II-2011',
    'Minimum Height of Numerals in Net Quantity Declaration',
    '2011-04-01',
    '{
      "thresholds": [
        {"max_pdp_area_sq_cm": 50, "min_height_normal_mm": 1.0, "min_height_blow_mould_mm": 2.0},
        {"max_pdp_area_sq_cm": 100, "min_height_normal_mm": 1.5, "min_height_blow_mould_mm": 3.0},
        {"max_pdp_area_sq_cm": 500, "min_height_normal_mm": 2.5, "min_height_blow_mould_mm": 4.0},
        {"max_pdp_area_sq_cm": 1000, "min_height_normal_mm": 4.0, "min_height_blow_mould_mm": 6.0},
        {"max_pdp_area_sq_cm": 999999, "min_height_normal_mm": 6.0, "min_height_blow_mould_mm": 8.0}
      ]
    }'::jsonb,
    'G.S.R. 202(E) dated 7th March, 2011'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
    'PCR-2011-RULE-6-1-M',
    'USP-Amendment-2021',
    'Legal Metrology (Packaged Commodities) (Second Amendment) Rules, 2021',
    '2022-12-01',
    '{
      "units": [
        {"type": "weight_under_1kg", "format": "Rs. per gram"},
        {"type": "weight_over_1kg", "format": "Rs. per kilogram"},
        {"type": "volume_under_1litre", "format": "Rs. per millilitre"},
        {"type": "volume_over_1litre", "format": "Rs. per litre"}
      ]
    }'::jsonb,
    'G.S.R. 779(E) dated 2nd November, 2021'
  )
on conflict (id) do nothing;
