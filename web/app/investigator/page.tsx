"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Search,
  Bell,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  FileText,
  ChevronRight,
  Eye,
  ScanLine,
  Scale,
  Sparkles,
  ArrowUpRight,
  Check,
  X,
  MessageSquare,
  Download,
  Share2,
  Printer,
  ChevronDown,
  Layers,
  ArrowRight,
  Upload,
  RefreshCw,
  LogOut,
  FolderLock,
  FileCheck2,
  Loader2,
  ExternalLink,
  Package,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import pcrRulesData from "@/lib/rules/pcr_2011.json";

// =========================================================================
// TYPES
// =========================================================================

interface DBInspection {
  id: string;
  case_number: string;
  title: string | null;
  product_name: string;
  brand: string;
  category: string;
  status: string;
  source_type: string | null;
  overall_confidence_score: number | null;
  created_at: string;
  images?: DBImage[];
  fields?: DBField[];
  findings?: DBFinding[];
}

interface DBImage {
  id: string;
  inspection_id: string;
  image_type: string;
  public_url: string | null;
  storage_path: string;
}

interface DBField {
  id: string;
  inspection_id: string;
  field_name: string;
  field_label: string;
  raw_value: string | null;
  confidence_score: number | null;
  review_status: string;
  is_human_corrected: boolean;
  corrected_value: string | null;
}

interface DBFinding {
  id: string;
  inspection_id: string;
  finding_number: string;
  title: string;
  severity: "critical" | "warning" | "advisory" | "compliant";
  observed_value: string | null;
  expected_requirement: string;
  explanation: string;
  rule_id: string | null;
  review_decision: string;
  investigator_notes: string | null;
}

// Fallback seed items if database has 0 inspections
const SEED_FALLBACK_CASES: DBInspection[] = [
  {
    id: "demo-001",
    case_number: "LM-2026-0842",
    title: "NutriSnack Roasted Almonds 200g",
    product_name: "NutriSnack Roasted Almonds 200g",
    brand: "NutriSnack Foods Ltd.",
    category: "Packaged Food",
    status: "review_required",
    source_type: "physical_inspection",
    overall_confidence_score: 94,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    fields: [
      {
        id: "f1",
        inspection_id: "demo-001",
        field_name: "mrp",
        field_label: "Maximum Retail Price (MRP)",
        raw_value: "₹ 199.00 (Incl. of all taxes)",
        confidence_score: 98,
        review_status: "accepted",
        is_human_corrected: false,
        corrected_value: null,
      },
      {
        id: "f2",
        inspection_id: "demo-001",
        field_name: "net_quantity",
        field_label: "Net Quantity",
        raw_value: "200 g (Numeral height 2.2mm)",
        confidence_score: 81,
        review_status: "pending",
        is_human_corrected: false,
        corrected_value: null,
      },
      {
        id: "f3",
        inspection_id: "demo-001",
        field_name: "manufacturing_date",
        field_label: "Month & Year of Manufacture",
        raw_value: "07/2026",
        confidence_score: 98,
        review_status: "accepted",
        is_human_corrected: false,
        corrected_value: null,
      },
      {
        id: "f4",
        inspection_id: "demo-001",
        field_name: "manufacturer_name",
        field_label: "Manufacturer / Packer Details",
        raw_value: "NutriSnack Foods Ltd., Plot 42, GIDC, Gujarat",
        confidence_score: 94,
        review_status: "accepted",
        is_human_corrected: false,
        corrected_value: null,
      },
    ],
    findings: [
      {
        id: "find-1",
        inspection_id: "demo-001",
        finding_number: "PCR-2011-R7-01",
        title: "Net Quantity Numeral Height Sub-Standard",
        severity: "warning",
        observed_value: "Numeral height 2.2 mm for 200g net quantity",
        expected_requirement: "Rule 7 Table 1 specifies minimum numeral height of 4.0 mm for net quantity 200g-500g",
        explanation: "Potential violation of Rule 7(1) — height of numeral is less than the prescribed minimum of 4.0mm.",
        rule_id: "Rule 7",
        review_decision: "pending",
        investigator_notes: "Requires physical verification with calibrated scale.",
      },
      {
        id: "find-2",
        inspection_id: "demo-001",
        finding_number: "PCR-2011-R6-01",
        title: "Unit Sale Price (USP) Missing",
        severity: "critical",
        observed_value: "No unit sale price declared (e.g. ₹0.995/g)",
        expected_requirement: "Rule 6(1)(h) requires mandatory Unit Sale Price declaration for packaged commodities",
        explanation: "Mandatory declaration under GSR 711(E) not detected on principal display panel.",
        rule_id: "Rule 6(1)(h)",
        review_decision: "pending",
        investigator_notes: null,
      },
    ],
  },
  {
    id: "demo-002",
    case_number: "LM-2026-0839",
    title: "PureDrop Refined Mustard Oil 1 Litre",
    product_name: "PureDrop Refined Mustard Oil 1 Litre",
    brand: "PureDrop Agro Mills",
    category: "Edible Oils",
    status: "verified",
    source_type: "ecommerce_listing",
    overall_confidence_score: 97,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    fields: [
      {
        id: "f21",
        inspection_id: "demo-002",
        field_name: "mrp",
        field_label: "Maximum Retail Price (MRP)",
        raw_value: "₹ 185.00 (Incl. of all taxes)",
        confidence_score: 99,
        review_status: "accepted",
        is_human_corrected: false,
        corrected_value: null,
      },
      {
        id: "f22",
        inspection_id: "demo-002",
        field_name: "net_quantity",
        field_label: "Net Quantity",
        raw_value: "1 L (810 g at 30°C)",
        confidence_score: 96,
        review_status: "accepted",
        is_human_corrected: false,
        corrected_value: null,
      },
    ],
    findings: [
      {
        id: "find-21",
        inspection_id: "demo-002",
        finding_number: "PCR-2011-R6-02",
        title: "Temperature Declaration on Edible Oil",
        severity: "warning",
        observed_value: "Weight declared as 810g at 30°C",
        expected_requirement: "Rule 12 requires dual declaration of volume and mass at 30°C for edible oils",
        explanation: "Dual declaration present and compliant with Rule 12 provisions.",
        rule_id: "Rule 12",
        review_decision: "accepted_compliant",
        investigator_notes: "Complies with legal dual-declaration requirement.",
      },
    ],
  },
  {
    id: "demo-003",
    case_number: "LM-2026-0835",
    title: "SunGlow Intensive Night Moisturizer 50g",
    product_name: "SunGlow Intensive Night Moisturizer 50g",
    brand: "SunGlow Derma Labs",
    category: "Cosmetics",
    status: "cleared",
    source_type: "physical_inspection",
    overall_confidence_score: 99,
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    fields: [
      {
        id: "f31",
        inspection_id: "demo-003",
        field_name: "mrp",
        field_label: "Maximum Retail Price (MRP)",
        raw_value: "₹ 450.00 (Incl. of all taxes)",
        confidence_score: 99,
        review_status: "accepted",
        is_human_corrected: false,
        corrected_value: null,
      },
    ],
    findings: [],
  },
];

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function InvestigatorDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [inspections, setInspections] = useState<DBInspection[]>([]);
  const [selectedCase, setSelectedCase] = useState<DBInspection | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "inspections" | "rules">("overview");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [officerProfile, setOfficerProfile] = useState<{ full_name: string; designation: string; badge_number: string } | null>(null);

  // Inspector feedback notification toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // -----------------------------------------------------------------------
  // LOAD REAL DATA FROM SUPABASE
  // -----------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Get current user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, designation, badge_number")
          .eq("id", user.id)
          .single();
        if (prof) {
          setOfficerProfile(prof);
        }
      }

      // 2. Fetch real inspections from Supabase
      const { data: dbInspections, error: inspErr } = await supabase
        .from("inspections")
        .select("*")
        .order("created_at", { ascending: false });

      if (!inspErr && dbInspections && dbInspections.length > 0) {
        // Fetch child fields, findings, images for these inspections
        const inspectionIds = dbInspections.map((i) => i.id);

        const [fieldsRes, findingsRes, imagesRes] = await Promise.all([
          supabase.from("extracted_fields").select("*").in("inspection_id", inspectionIds),
          supabase.from("pipeline_findings").select("*").in("inspection_id", inspectionIds),
          supabase.from("inspection_images").select("*").in("inspection_id", inspectionIds),
        ]);

        const fullInspections: DBInspection[] = dbInspections.map((insp) => ({
          ...insp,
          fields: fieldsRes.data?.filter((f) => f.inspection_id === insp.id) ?? [],
          findings: findingsRes.data?.filter((f) => f.inspection_id === insp.id) ?? [],
          images: imagesRes.data?.filter((img) => img.inspection_id === insp.id) ?? [],
        }));

        setInspections(fullInspections);
        setSelectedCase(fullInspections[0]);
      } else {
        // Use seed items if database table is currently empty
        setInspections(SEED_FALLBACK_CASES);
        setSelectedCase(SEED_FALLBACK_CASES[0]);
      }
    } catch (err) {
      console.error("Failed to load inspections:", err);
      setInspections(SEED_FALLBACK_CASES);
      setSelectedCase(SEED_FALLBACK_CASES[0]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -----------------------------------------------------------------------
  // UPDATE FINDING REVIEW STATUS (REAL PERSISTENCE)
  // -----------------------------------------------------------------------

  const updateFindingStatus = async (findingId: string, newDecision: string) => {
    if (!selectedCase) return;

    // Optimistic UI update
    const updatedFindings = (selectedCase.findings ?? []).map((f) =>
      f.id === findingId ? { ...f, review_decision: newDecision } : f
    );

    const updatedCase = {
      ...selectedCase,
      findings: updatedFindings,
    };

    setSelectedCase(updatedCase);
    setInspections((prev) =>
      prev.map((c) => (c.id === selectedCase.id ? updatedCase : c))
    );

    // Persist to Supabase if not a demo-id
    if (!findingId.startsWith("find-")) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from("pipeline_findings")
        .update({
          review_decision: newDecision,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", findingId);
    }

    showNotification(`Finding decision saved as "${newDecision.replace(/_/g, " ")}"`);
  };

  // -----------------------------------------------------------------------
  // COMPUTED KPIS & FILTERING
  // -----------------------------------------------------------------------

  const totalInspectionsCount = inspections.length;
  const pendingReviewCount = inspections.filter((i) => i.status === "review_required" || i.status === "Review Required").length;
  const totalViolationsCount = inspections.reduce((acc, i) => acc + (i.findings?.filter((f) => f.severity === "critical" || f.severity === "warning").length ?? 0), 0);
  const verifiedCount = inspections.filter((i) => i.status === "verified" || i.status === "cleared").length;

  const filteredInspections = inspections.filter((c) => {
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      c.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const allQueueFindings = inspections.flatMap((insp) =>
    (insp.findings ?? []).map((f) => ({ ...f, parentInspection: insp }))
  ).filter((f) => f.review_decision === "pending" || f.severity === "critical" || f.severity === "warning");

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* =========================================================
          TOP COMMAND BAR (LIGHT THEME)
      ========================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-sm text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">PackCheck</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  ENFORCEMENT OS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Legal Metrology Intelligence Command Center</p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "queue"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Review Queue
              {allQueueFindings.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                  {allQueueFindings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("inspections")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "inspections"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inspections
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "rules"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rule Book (PCR 2011)
            </button>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Global New Inspection CTA -> Routes to Real /inspection/new */}
          <Link
            href="/inspection/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Inspection</span>
          </Link>

          {/* Refresh Data */}
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            title="Refresh Inspections"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold">
              {officerProfile?.full_name ? officerProfile.full_name.slice(0, 2).toUpperCase() : "RS"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-none text-slate-900">
                {officerProfile?.full_name ?? "Officer R. Sharma"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {officerProfile?.designation ?? "Legal Metrology Inspector"}
              </p>
            </div>
            <Link
              href="/login"
              title="Sign Out"
              className="ml-2 text-slate-400 hover:text-rose-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* SUB-HEADER / BANNER */}
      <div className="border-b border-slate-200 bg-slate-100/90 px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center gap-3 text-slate-700">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            Legal Metrology Act 2009 & Packaged Commodities Rules 2011 Active Engine
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">Jurisdiction: Central & State Enforcement</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/consumer"
            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 transition"
          >
            <span>Switch to Public Consumer Check</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* =========================================================
          MAIN BODY CONTAINER
      ========================================================== */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* =========================================================
            KPI CARDS ROW (REAL METRICS)
        ========================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KPICard
            title="Total Inspections"
            value={String(totalInspectionsCount)}
            subtitle="Real database cases"
            badge="Enforcement"
            badgeColor="blue"
            icon={<Scale className="h-5 w-5 text-blue-600" />}
          />
          <KPICard
            title="Pending Review"
            value={String(pendingReviewCount)}
            subtitle="Require investigator decision"
            badge="Action Required"
            badgeColor="amber"
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          />
          <KPICard
            title="Potential Violations"
            value={String(totalViolationsCount)}
            subtitle="Detected under PCR 2011"
            badge="Flagged"
            badgeColor="red"
            icon={<AlertOctagon className="h-5 w-5 text-rose-600" />}
          />
          <KPICard
            title="Verified Findings"
            value={String(verifiedCount)}
            subtitle="Confirmed & docketed"
            badge="Legally Validated"
            badgeColor="emerald"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          />
        </section>

        {/* =========================================================
            TAB: OVERVIEW
        ========================================================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: ACTIVE CASES LIST (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Active Inspections</h2>
                  <p className="text-xs text-slate-500 font-medium">Select a case to inspect evidence & record decisions</p>
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  {filteredInspections.length} cases
                </span>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search case ID, product, brand..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-xs"
                >
                  <option value="all">All Categories</option>
                  <option value="Packaged Food">Packaged Food</option>
                  <option value="Edible Oils">Edible Oils</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Electronics">Electronics</option>
                </select>
              </div>

              {/* Case Cards List */}
              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                {filteredInspections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No inspections found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Upload your first package image to start analysis.</p>
                    <Link
                      href="/inspection/new"
                      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" /> + New Inspection
                    </Link>
                  </div>
                ) : (
                  filteredInspections.map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    const findingsCount = c.findings?.length ?? 0;
                    const ocrScore = Math.round(c.overall_confidence_score ?? 95);

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className={`group relative rounded-2xl border p-4 transition cursor-pointer shadow-xs ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {c.case_number}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                              {c.product_name}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {c.brand} • {c.category}
                            </p>
                          </div>

                          <StatusBadge status={c.status} />
                        </div>

                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                          <div className="flex items-center gap-3 font-medium text-slate-600">
                            <span>
                              OCR: <strong className="text-slate-900">{ocrScore}%</strong>
                            </span>
                            <span>
                              Findings: <strong className={findingsCount > 0 ? "text-amber-600" : "text-emerald-600"}>{findingsCount}</strong>
                            </span>
                          </div>

                          <Link
                            href={`/inspection/${c.id}/overview`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800 transition"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: SELECTED CASE EVIDENCE & COMPLIANCE DETAIL (7 cols) */}
            <div className="lg:col-span-7">
              {selectedCase ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-sm space-y-6">
                  {/* Case Header & Actions */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {selectedCase.case_number}
                        </span>
                        <StatusBadge status={selectedCase.status} />
                      </div>
                      <h1 className="text-lg font-bold text-slate-900 mt-1.5">{selectedCase.product_name}</h1>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Manufacturer/Brand: <strong className="text-slate-700">{selectedCase.brand}</strong> • Category: <strong className="text-slate-700">{selectedCase.category}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/inspection/${selectedCase.id}/report`}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                        <span>Print Docket</span>
                      </Link>
                      <Link
                        href={`/inspection/${selectedCase.id}/report`}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Export Report</span>
                      </Link>
                    </div>
                  </div>

                  {/* Split Workspace: Left = Evidence Image / Right = Extracted Declarations */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Left: Package Evidence Container */}
                    <div className="md:col-span-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <ScanLine className="h-3.5 w-3.5 text-emerald-600" />
                          Package Evidence
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          OCR {Math.round(selectedCase.overall_confidence_score ?? 94)}%
                        </span>
                      </div>

                      {/* Package Visual Frame */}
                      <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 aspect-[4/5] flex flex-col justify-between overflow-hidden shadow-inner">
                        {selectedCase.images && selectedCase.images.length > 0 && selectedCase.images[0].public_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedCase.images[0].public_url}
                            alt="Package Evidence"
                            className="absolute inset-0 w-full h-full object-contain p-2"
                          />
                        ) : (
                          <>
                            {/* Simulated OCR bounding boxes on package canvas */}
                            <div className="rounded-lg border border-emerald-400/80 bg-emerald-100/40 p-2.5 text-[11px] text-slate-800">
                              <span className="font-mono text-[9px] font-bold text-emerald-800 uppercase block mb-1">
                                PDP REGION #01
                              </span>
                              <div className="h-2 w-24 bg-slate-300/80 rounded mb-1.5" />
                              <div className="h-2 w-32 bg-slate-300/80 rounded" />
                            </div>

                            <div className="rounded-lg border border-amber-400 bg-amber-100/50 p-2.5 text-[11px] border-dashed">
                              <div className="flex items-center gap-1 text-amber-800 font-bold text-[10px]">
                                <AlertTriangle className="h-3 w-3" /> Flagged Region
                              </div>
                              <p className="text-[10px] text-slate-700 font-medium mt-1">
                                Net Quantity: 200g (Numeral: 2.2mm)
                              </p>
                            </div>

                            <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                              <div>MRP: ₹199.00 (Incl. Taxes)</div>
                              <div>Mfg: 07/2026</div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <Link
                          href={`/inspection/${selectedCase.id}/evidence`}
                          className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Full Evidence Viewer →
                        </Link>
                      </div>
                    </div>

                    {/* Right: Extracted Declarations Column */}
                    <div className="md:col-span-7 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Extracted Mandatory Declarations
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">PCR 2011 Rule 6</span>
                      </div>

                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {selectedCase.fields && selectedCase.fields.length > 0 ? (
                          selectedCase.fields.map((decl) => (
                            <div
                              key={decl.id}
                              className={`rounded-xl border p-3 transition ${
                                decl.review_status === "accepted"
                                  ? "border-slate-200 bg-slate-50/70"
                                  : "border-amber-300 bg-amber-50/50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                    {decl.field_label}
                                  </p>
                                  <p className="text-xs font-bold text-slate-900">
                                    {decl.is_human_corrected ? decl.corrected_value : decl.raw_value ?? "Not Detected"}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    decl.review_status === "accepted"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {decl.review_status === "accepted" ? (
                                    <>
                                      <Check className="h-3 w-3" /> Valid
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-3 w-3" /> Flagged
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                <span className="font-mono">{decl.field_name}</span>
                                <span>{Math.round(decl.confidence_score ?? 95)}% conf.</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">No declarations extracted yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Findings Review Panel */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <AlertOctagon className="h-4 w-4 text-rose-600" />
                        Identified Compliance Findings ({selectedCase.findings?.length ?? 0})
                      </span>
                      <Link
                        href={`/inspection/${selectedCase.id}/compliance`}
                        className="text-xs font-bold text-blue-700 hover:text-blue-800"
                      >
                        Open Compliance Matrix →
                      </Link>
                    </div>

                    {selectedCase.findings && selectedCase.findings.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCase.findings.map((finding) => (
                          <div
                            key={finding.id}
                            className={`rounded-xl border p-4 space-y-3 ${
                              finding.severity === "critical"
                                ? "border-rose-300 bg-rose-50/40"
                                : finding.severity === "warning"
                                ? "border-amber-300 bg-amber-50/40"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300">
                                    {finding.finding_number}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">{finding.title}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{finding.explanation}</p>
                              </div>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${
                                  finding.review_decision === "confirmed_violation"
                                    ? "bg-rose-600 text-white"
                                    : finding.review_decision === "accepted_compliant"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-amber-500 text-white"
                                }`}
                              >
                                {finding.review_decision.replace(/_/g, " ")}
                              </span>
                            </div>

                            {/* Review Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                              <button
                                onClick={() => updateFindingStatus(finding.id, "confirmed_violation")}
                                className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-2.5 py-1 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                              >
                                <Check className="h-3 w-3" /> Confirm Violation
                              </button>
                              <button
                                onClick={() => updateFindingStatus(finding.id, "accepted_compliant")}
                                className="flex items-center gap-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 transition cursor-pointer"
                              >
                                <X className="h-3 w-3" /> Accept as Compliant
                              </button>
                              <button
                                onClick={() => updateFindingStatus(finding.id, "needs_further_inspection")}
                                className="flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2.5 py-1 text-xs font-bold text-blue-700 transition cursor-pointer"
                              >
                                <Clock className="h-3 w-3" /> Further Inspection
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center text-xs text-emerald-800 font-semibold">
                        ✓ No non-compliance findings detected for this product.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                  Select an inspection from the left to view evidence and declarations.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB: REVIEW QUEUE
        ========================================================== */}
        {activeTab === "queue" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Investigator Review Queue</h2>
              <p className="text-xs text-slate-500 font-medium">
                Mandatory human review items awaiting legal metrology officer confirmation
              </p>
            </div>

            {allQueueFindings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
                No pending review findings. All items have been processed!
              </div>
            ) : (
              <div className="space-y-3">
                {allQueueFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                          {finding.parentInspection?.case_number}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{finding.title}</span>
                        <span className="text-[10px] text-slate-500 font-medium">({finding.parentInspection?.product_name})</span>
                      </div>
                      <p className="text-xs text-slate-600">{finding.explanation}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/inspection/${finding.parentInspection?.id}/compliance`}
                        className="flex items-center gap-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 text-xs font-bold transition"
                      >
                        Review Finding <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB: ALL INSPECTIONS TABLE
        ========================================================== */}
        {activeTab === "inspections" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">All Registered Inspections</h2>
                <p className="text-xs text-slate-500 font-medium">Complete enforcement library and case history</p>
              </div>
              <Link
                href="/inspection/new"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm"
              >
                <Plus className="h-4 w-4" /> + New Inspection
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Case ID</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{insp.case_number}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{insp.product_name}</td>
                      <td className="py-3 px-3 text-slate-600">{insp.brand}</td>
                      <td className="py-3 px-3 text-slate-600">{insp.category}</td>
                      <td className="py-3 px-3"><StatusBadge status={insp.status} /></td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(insp.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/inspection/${insp.id}/overview`}
                          className="font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-0.5"
                        >
                          Workspace <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB: RULE BOOK (PCR 2011)
        ========================================================== */}
        {activeTab === "rules" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Legal Metrology (Packaged Commodities) Rules, 2011</h2>
              <p className="text-xs text-slate-500 font-medium">
                Standard codified reference matrix applied by the PackCheck deterministic compliance engine
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pcrRulesData.rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {rule.code} ({rule.section})
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      rule.critical ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {rule.critical ? "Critical Requirement" : "Standard Rule"}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{rule.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{rule.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{rule.penalty_section}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// =========================================================================
// HELPER COMPONENTS
// =========================================================================

function KPICard({
  title,
  value,
  subtitle,
  badge,
  badgeColor,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  badge: string;
  badgeColor: "blue" | "amber" | "red" | "emerald";
  icon: React.ReactNode;
}) {
  const badgeClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{title}</span>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{icon}</div>
      </div>
      <div>
        <p className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">{subtitle}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase border ${badgeClasses[badgeColor]}`}>
            {badge}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    review_required: { label: "Review Required", className: "bg-amber-50 text-amber-700 border-amber-200" },
    "Review Required": { label: "Review Required", className: "bg-amber-50 text-amber-700 border-amber-200" },
    verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    Verified: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    cleared: { label: "Cleared", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    Cleared: { label: "Cleared", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    processing: { label: "Processing", className: "bg-blue-50 text-blue-700 border-blue-200" },
    non_compliant: { label: "Non-Compliant", className: "bg-rose-50 text-rose-700 border-rose-200" },
    report_generated: { label: "Report Ready", className: "bg-violet-50 text-violet-700 border-violet-200" },
    draft: { label: "Draft", className: "bg-slate-50 text-slate-700 border-slate-200" },
  };

  const current = map[status] ?? { label: status, className: "bg-slate-50 text-slate-700 border-slate-200" };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${current.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {current.label}
    </span>
  );
}
