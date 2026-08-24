export interface DeclarationItem {
  id: string;
  field: string;
  observedValue: string;
  confidence: number;
  status: "verified" | "flagged" | "missing";
  ruleReference: string;
  evidenceRegion: string;
  notes?: string;
}

export interface ComplianceFinding {
  id: string;
  caseId: string;
  productName: string;
  category: string;
  severity: "critical" | "warning" | "advisory" | "compliant";
  title: string;
  observedValue: string;
  expectedRequirement: string;
  applicableRule: string;
  reason: string;
  evidenceRegion: string;
  confidence: number;
  status: "Pending Review" | "Confirmed" | "Dismissed" | "Evidence Requested";
  date: string;
  investigatorNotes?: string;
}

export interface InspectionCase {
  id: string;
  productName: string;
  brand: string;
  category: "Packaged Food" | "Edible Oils" | "Cosmetics" | "Personal Care" | "Beverages";
  date: string;
  status: "Review Required" | "Verified" | "Cleared" | "Processing" | "Report Generated";
  findingsCount: number;
  declarationsCount: number;
  reviewer: string;
  confidenceScore: number;
  evidenceImage: string;
  declarations: DeclarationItem[];
  findings: ComplianceFinding[];
}

export const INITIAL_INSPECTIONS: InspectionCase[] = [
  {
    id: "LM-2026-0842",
    productName: "NutriSnack Roasted Almonds 200g",
    brand: "NutriSnack Foods Ltd.",
    category: "Packaged Food",
    date: "24 Aug 2026",
    status: "Review Required",
    findingsCount: 2,
    declarationsCount: 6,
    reviewer: "Officer R. Sharma",
    confidenceScore: 94,
    evidenceImage: "almonds_pack.jpg",
    declarations: [
      {
        id: "d1",
        field: "Maximum Retail Price (MRP)",
        observedValue: "₹ 199.00 (Incl. of all taxes)",
        confidence: 98,
        status: "verified",
        ruleReference: "PCR 2011 Rule 6(1)(e)",
        evidenceRegion: "Back label top right",
      },
      {
        id: "d2",
        field: "Net Quantity",
        observedValue: "200 g (Numeral height 2.2mm)",
        confidence: 91,
        status: "flagged",
        ruleReference: "PCR 2011 Rule 7 & Schedule II",
        evidenceRegion: "Front panel bottom",
        notes: "Numeral height is 2.2mm, minimum requirement for 200g is 4.0mm.",
      },
      {
        id: "d3",
        field: "Month & Year of Manufacture",
        observedValue: "07/2026",
        confidence: 96,
        status: "verified",
        ruleReference: "PCR 2011 Rule 6(1)(d)",
        evidenceRegion: "Back seal",
      },
      {
        id: "d4",
        field: "Manufacturer & Packer Details",
        observedValue: "NutriSnack Foods Ltd., Plot 14, MIDC Andheri, Mumbai 400093",
        confidence: 95,
        status: "verified",
        ruleReference: "PCR 2011 Rule 6(1)(a)",
        evidenceRegion: "Back panel base",
      },
      {
        id: "d5",
        field: "Country of Origin",
        observedValue: "India",
        confidence: 99,
        status: "verified",
        ruleReference: "PCR 2011 Rule 6(10)",
        evidenceRegion: "Front panel bottom left",
      },
      {
        id: "d6",
        field: "Consumer Care Contact",
        observedValue: "care@nutrisnack.in (Missing telephone number)",
        confidence: 89,
        status: "flagged",
        ruleReference: "PCR 2011 Rule 6(1)(h)",
        evidenceRegion: "Side panel",
        notes: "Mandatory telephone number is omitted.",
      },
    ],
    findings: [
      {
        id: "f-101",
        caseId: "LM-2026-0842",
        productName: "NutriSnack Roasted Almonds 200g",
        category: "Packaged Food",
        severity: "warning",
        title: "Net Quantity Numeral Height Below Prescribed Minimum",
        observedValue: "2.2 mm numeral height",
        expectedRequirement: "Minimum 4.0 mm for package net weight between 200g and 500g",
        applicableRule: "Legal Metrology (Packaged Commodities) Rules 2011, Schedule II",
        reason: "Font size on Principal Display Panel does not conform to the prescribed standard table.",
        evidenceRegion: "Front Panel (Bottom 15%)",
        confidence: 92,
        status: "Pending Review",
        date: "24 Aug 2026",
      },
      {
        id: "f-102",
        caseId: "LM-2026-0842",
        productName: "NutriSnack Roasted Almonds 200g",
        category: "Packaged Food",
        severity: "warning",
        title: "Incomplete Consumer Care Contact Declaration",
        observedValue: "Email only: care@nutrisnack.in",
        expectedRequirement: "Must include Name, Address, Telephone number and Email address of the person/grievance cell",
        applicableRule: "Legal Metrology (Packaged Commodities) Rules 2011, Rule 6(1)(h)",
        reason: "Mandatory consumer grievance telephone contact is absent from the side panel declaration.",
        evidenceRegion: "Side Panel (Grievance Box)",
        confidence: 95,
        status: "Pending Review",
        date: "24 Aug 2026",
      },
    ],
  },
  {
    id: "LM-2026-0839",
    productName: "PureDrop Refined Mustard Oil 1 Litre",
    brand: "PureDrop Agro Mills",
    category: "Edible Oils",
    date: "23 Aug 2026",
    status: "Verified",
    findingsCount: 1,
    declarationsCount: 6,
    reviewer: "Officer R. Sharma",
    confidenceScore: 97,
    evidenceImage: "mustard_oil.jpg",
    declarations: [
      {
        id: "d11",
        field: "Maximum Retail Price (MRP)",
        observedValue: "₹ 165.00 (Inclusive of all taxes)",
        confidence: 99,
        status: "verified",
        ruleReference: "PCR 2011 Rule 6(1)(e)",
        evidenceRegion: "Front sticker top",
      },
      {
        id: "d12",
        field: "Net Quantity & Equivalent Mass",
        observedValue: "1 L / 910 g",
        confidence: 96,
        status: "verified",
        ruleReference: "PCR 2011 Rule 12 & Edible Oil Notification",
        evidenceRegion: "Front label center",
      },
    ],
    findings: [
      {
        id: "f-201",
        caseId: "LM-2026-0839",
        productName: "PureDrop Refined Mustard Oil 1 Litre",
        category: "Edible Oils",
        severity: "critical",
        title: "Unit Sale Price (USP) Omitted from E-Commerce and Label",
        observedValue: "MRP mentioned, Unit Sale Price missing",
        expectedRequirement: "Unit Sale Price per litre/gram mandatory for all pre-packaged commodities",
        applicableRule: "PCR 2011 Rule 6(1)(m) (as amended)",
        reason: "Declaration of Unit Sale Price (e.g. ₹0.165/ml or ₹16.50/100ml) is missing.",
        evidenceRegion: "Front PDP area",
        confidence: 97,
        status: "Confirmed",
        date: "23 Aug 2026",
        investigatorNotes: "Notice issued to brand under Section 36 of Legal Metrology Act 2009.",
      },
    ],
  },
  {
    id: "LM-2026-0835",
    productName: "SunGlow Intensive Night Moisturizer 50g",
    brand: "SunGlow Derma Labs",
    category: "Cosmetics",
    date: "22 Aug 2026",
    status: "Cleared",
    findingsCount: 0,
    declarationsCount: 6,
    reviewer: "Officer P. Nair",
    confidenceScore: 99,
    evidenceImage: "moisturizer.jpg",
    declarations: [],
    findings: [],
  },
  {
    id: "LM-2026-0828",
    productName: "Arogya Organic Green Tea 100 Tea Bags",
    brand: "Arogya Herbal Remedies",
    category: "Beverages",
    date: "21 Aug 2026",
    status: "Report Generated",
    findingsCount: 1,
    declarationsCount: 6,
    reviewer: "Officer R. Sharma",
    confidenceScore: 96,
    evidenceImage: "greentea.jpg",
    declarations: [],
    findings: [
      {
        id: "f-301",
        caseId: "LM-2026-0828",
        productName: "Arogya Organic Green Tea 100 Tea Bags",
        category: "Beverages",
        severity: "warning",
        title: "Net Count / Number Declaration Ambiguity",
        observedValue: "100 Bags (Weight missing)",
        expectedRequirement: "Number of units and total net weight in grams both required for tea bags",
        applicableRule: "PCR 2011 Schedule III",
        reason: "Only count was declared without net aggregate mass.",
        evidenceRegion: "Top flap",
        confidence: 93,
        status: "Confirmed",
        date: "21 Aug 2026",
      },
    ],
  },
];

export const DEMO_TEST_PACKAGES = [
  {
    id: "demo-almonds",
    name: "NutriSnack Roasted Almonds 200g",
    brand: "NutriSnack Foods Ltd.",
    category: "Packaged Food",
    simulatedNetQty: "200 g (2.2mm font)",
    simulatedMRP: "₹ 199.00",
    simulatedMfg: "07/2026",
    sampleIssues: [
      "Net Quantity font height 2.2mm (violates min 4.0mm requirement for 200g)",
      "Customer care helpline phone number missing",
    ],
    consumerAdvice: "Check if the manufacturer contact phone number is clearly stated on the box before purchasing.",
  },
  {
    id: "demo-oil",
    name: "PureDrop Refined Mustard Oil 1L",
    brand: "PureDrop Agro Mills",
    category: "Edible Oils",
    simulatedNetQty: "1 L (910g mass declared)",
    simulatedMRP: "₹ 165.00",
    simulatedMfg: "08/2026",
    sampleIssues: [
      "Missing Unit Sale Price (USP) declaration as per latest amendment",
    ],
    consumerAdvice: "Always verify that both volume (1 Litre) and equivalent mass are clearly printed on edible oil packages.",
  },
  {
    id: "demo-tea",
    name: "Arogya Organic Green Tea 100 Bags",
    brand: "Arogya Herbal Remedies",
    category: "Beverages",
    simulatedNetQty: "100 Bags (200g total)",
    simulatedMRP: "₹ 340.00",
    simulatedMfg: "06/2026",
    sampleIssues: [
      "Total aggregate net mass not declared alongside count on outer box",
    ],
    consumerAdvice: "For packaged tea bags, both unit count and total net weight must be readable.",
  },
];
