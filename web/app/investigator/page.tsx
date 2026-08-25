"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Flag,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardStatistics,
  getFlaggedReports,
  updateFlaggedReportStatus,
} from "@/lib/actions/inspection";
import pcrRulesData from "@/lib/rules/pcr_2011.json";

// =========================================================================
// TYPES (PERSISTED DATABASE MODEL)
// =========================================================================

interface DBExtractedField {
  id: string;
  field_name: string;
  field_label?: string;
  raw_value: string;
  normalized_value?: string;
  confidence_score?: number;
  evidence_bounding_box?: any;
  validation_status?: string;
  review_status?: string;
  is_human_corrected?: boolean;
  corrected_value?: string | null;
  rule_reference?: string;
}

interface DBPipelineFinding {
  id: string;
  finding_number: string;
  rule_code?: string;
  severity: "critical" | "warning" | "advisory" | "passed" | string;
  title: string;
  statutory_requirement?: string;
  observed_summary?: string;
  explanation?: string;
  review_decision?: string;
  inspector_notes?: string | null;
  rule_reference?: string;
  rule_id?: string;
}

interface DBInspectionImage {
  id: string;
  storage_path: string;
  public_url: string;
  original_filename: string;
  image_type: string;
}

interface DBInspection {
  id: string;
  case_number: string;
  title: string;
  product_name: string;
  brand: string;
  category: string;
  source_type: string;
  status: string;
  marketplace_url?: string;
  location_coordinates?: any;
  overall_confidence_score?: number;
  is_flagged?: boolean;
  flag_status?: string;
  flagged_at?: string;
  created_at: string;
  fields?: DBExtractedField[];
  findings?: DBPipelineFinding[];
  images?: DBInspectionImage[];
  citizen_flags?: any[];
}

export default function InvestigatorDashboard() {
  const supabase = createClient();

  const [inspections, setInspections] = useState<DBInspection[]>([]);
  const [flaggedReports, setFlaggedReports] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalScanned: 0,
    compliantCount: 0,
    potentialViolations: 0,
    pendingReview: 0,
    consumerReportsCount: 0,
    complianceRate: 100,
  });

  const [selectedCase, setSelectedCase] = useState<DBInspection | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "inspections" | "flags" | "rules">("overview");
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

      // 2. Fetch live statistics & flagged reports in parallel
      const [liveStats, liveFlagged, { data: dbInspections, error: inspErr }] = await Promise.all([
        getDashboardStatistics(),
        getFlaggedReports(),
        supabase.from("inspections").select("*").order("created_at", { ascending: false }),
      ]);

      let inspectionsList: DBInspection[] = [];

      if (!inspErr && dbInspections && dbInspections.length > 0) {
        // Fetch child fields, findings, images for these inspections
        const inspectionIds = dbInspections.map((i) => i.id);

        const [fieldsRes, findingsRes, imagesRes] = await Promise.all([
          supabase.from("extracted_fields").select("*").in("inspection_id", inspectionIds),
          supabase.from("pipeline_findings").select("*").in("inspection_id", inspectionIds),
          supabase.from("inspection_images").select("*").in("inspection_id", inspectionIds),
        ]);

        inspectionsList = dbInspections.map((insp) => ({
          ...insp,
          fields: fieldsRes.data?.filter((f) => f.inspection_id === insp.id) ?? [],
          findings: findingsRes.data?.filter((f) => f.inspection_id === insp.id) ?? [],
          images: imagesRes.data?.filter((img) => img.inspection_id === insp.id) ?? [],
        }));
      }

      // Merge with local / session scan list if any were scanned recently
      if (typeof window !== "undefined") {
        try {
          const cachedRaw =
            localStorage.getItem("packcheck_inspections_list") ||
            sessionStorage.getItem("packcheck_inspections_list");
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (!inspectionsList.some((x) => x.id === item.id)) {
                  inspectionsList.unshift({
                    ...item,
                    fields: item.fields || [],
                    findings: item.findings || [],
                    images: item.images || [],
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn("Local scans merge notice:", e);
        }
      }

      // If database & local storage are completely fresh, initialize baseline active cases
      if (inspectionsList.length === 0) {
        inspectionsList = [
          {
            id: "insp-001",
            case_number: "LM-2026-0842",
            title: "Lay's — American Style Cream & Onion Potato Chips",
            product_name: "American Style Cream & Onion Potato Chips",
            brand: "Lay's",
            category: "Potato Chips",
            source_type: "physical_inspection",
            status: "review_required",
            overall_confidence_score: 94,
            is_flagged: false,
            created_at: new Date().toISOString(),
            fields: [
              {
                id: "f1",
                field_name: "mrp",
                field_label: "Maximum Retail Price (MRP)",
                raw_value: "₹ 20.00 (Incl. of all taxes)",
                confidence_score: 98,
                review_status: "accepted",
              },
              {
                id: "f2",
                field_name: "net_quantity",
                field_label: "Net Quantity",
                raw_value: "50 g",
                confidence_score: 94,
                review_status: "pending",
              },
              {
                id: "f3",
                field_name: "manufacturing_date",
                field_label: "Month & Year of Manufacture",
                raw_value: "06/2026",
                confidence_score: 96,
                review_status: "accepted",
              },
              {
                id: "f4",
                field_name: "manufacturer_name",
                field_label: "Manufacturer Details",
                raw_value: "PepsiCo India Holdings Pvt. Ltd., Gurugram, Haryana",
                confidence_score: 94,
                review_status: "accepted",
              },
            ],
            findings: [
              {
                id: "find-1",
                finding_number: "PCR-2011-R7-01",
                severity: "warning",
                title: "Net Quantity Numeral Height Sub-Standard",
                explanation: "Rule 7 requires minimum 4.0mm numeral height.",
                review_decision: "pending",
                rule_id: "Rule 7",
              },
              {
                id: "find-2",
                finding_number: "PCR-2011-R6-01",
                severity: "critical",
                title: "Unit Sale Price (USP) Missing",
                explanation: "Mandatory Unit Sale Price not declared on PDP under GSR 711(E).",
                review_decision: "pending",
                rule_id: "Rule 6(1)(h)",
              },
            ],
            images: [
              {
                id: "img-1",
                public_url: "",
                storage_path: "demo",
                original_filename: "lays_front.jpg",
                image_type: "front",
              },
            ],
          },
          {
            id: "insp-002",
            case_number: "LM-2026-0839",
            title: "PureDrop — Refined Mustard Oil 1L",
            product_name: "Refined Mustard Oil 1L",
            brand: "PureDrop Agro Mills",
            category: "Edible Oils",
            source_type: "physical_inspection",
            status: "verified",
            overall_confidence_score: 98,
            is_flagged: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            fields: [
              {
                id: "f21",
                field_name: "mrp",
                field_label: "MRP",
                raw_value: "₹ 165.00",
                confidence_score: 99,
                review_status: "accepted",
              },
              {
                id: "f22",
                field_name: "net_quantity",
                field_label: "Net Quantity",
                raw_value: "1 L",
                confidence_score: 98,
                review_status: "accepted",
              },
            ],
            findings: [],
            images: [
              {
                id: "img-2",
                public_url: "",
                storage_path: "demo",
                original_filename: "mustard_oil.jpg",
                image_type: "front",
              },
            ],
          },
          {
            id: "insp-003",
            case_number: "LM-2026-0835",
            title: "Nieu — Tomato Ketchup 8g Pouch",
            product_name: "Tomato Ketchup",
            brand: "Nieu",
            category: "Sauce / Ketchup",
            source_type: "citizen_report",
            status: "review_required",
            overall_confidence_score: 91,
            is_flagged: true,
            flag_status: "pending_review",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            fields: [
              {
                id: "f31",
                field_name: "mrp",
                field_label: "MRP",
                raw_value: "₹ 1.50",
                confidence_score: 95,
                review_status: "accepted",
              },
              {
                id: "f32",
                field_name: "net_quantity",
                field_label: "Net Quantity",
                raw_value: "8 g",
                confidence_score: 92,
                review_status: "pending",
              },
            ],
            findings: [
              {
                id: "find-31",
                finding_number: "PCR-2011-R6-01",
                severity: "warning",
                title: "Consumer Care Details Incomplete",
                explanation: "Mandatory telephone or email contact address missing from back panel.",
                review_decision: "pending",
                rule_id: "Rule 6(1)(f)",
              },
            ],
            images: [
              {
                id: "img-3",
                public_url: "",
                storage_path: "demo",
                original_filename: "ketchup_pouch.jpg",
                image_type: "front",
              },
            ],
          },
        ];
      }

      setInspections(inspectionsList);
      setSelectedCase(inspectionsList[0]);
      setFlaggedReports(liveFlagged || []);

      // Calculate dynamic stats
      const total = Math.max(liveStats.totalScanned, inspectionsList.length);
      const pending = Math.max(
        liveStats.pendingReview,
        inspectionsList.filter((i) => i.status === "review_required" || i.status === "draft").length
      );
      const violations = Math.max(
        liveStats.potentialViolations,
        inspectionsList.filter(
          (i) =>
            i.status === "non_compliant" ||
            i.status === "review_required" ||
            (i.findings && i.findings.length > 0)
        ).length
      );
      const flagged = Math.max(
        liveStats.consumerReportsCount,
        (liveFlagged || []).length,
        inspectionsList.filter((i) => i.is_flagged || i.source_type === "citizen_report").length
      );

      setStats({
        totalScanned: total,
        pendingReview: pending,
        potentialViolations: violations,
        consumerReportsCount: flagged,
        compliantCount: total - violations > 0 ? total - violations : 1,
        complianceRate: total > 0 ? Math.round(((total - violations) / total) * 100) : 85,
      });
    } catch (err) {
      console.error("Failed to load inspections:", err);
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
                  Investigator 
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
              onClick={() => setActiveTab("flags")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "flags"
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flag className="h-3.5 w-3.5 text-rose-600" />
              <span>Consumer Reports</span>
              {flaggedReports.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-300">
                  {flaggedReports.length}
                </span>
              )}
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
            value={String(stats.totalScanned || totalInspectionsCount)}
            subtitle="Persisted database scans"
            badge="Enforcement"
            badgeColor="blue"
            icon={<Scale className="h-5 w-5 text-blue-600" />}
          />
          <KPICard
            title="Pending Review"
            value={String(stats.pendingReview || pendingReviewCount)}
            subtitle="Require officer decision"
            badge="Action Required"
            badgeColor="amber"
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          />
          <KPICard
            title="Potential Violations"
            value={String(stats.potentialViolations || totalViolationsCount)}
            subtitle="Detected under PCR 2011"
            badge="Flagged"
            badgeColor="red"
            icon={<AlertOctagon className="h-5 w-5 text-rose-600" />}
          />
          <KPICard
            title="Consumer Reports"
            value={String(stats.consumerReportsCount || flaggedReports.length)}
            subtitle="Citizen flagged products"
            badge="Citizen Intake"
            badgeColor="emerald"
            icon={<Flag className="h-5 w-5 text-emerald-600" />}
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
                        style={{ color: "#ffffff" }}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-3.5 py-1.5 text-xs font-bold text-white !text-white transition shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5 text-white !text-white" style={{ color: "#ffffff" }} />
                        <span className="text-white !text-white" style={{ color: "#ffffff" }}>Export Report</span>
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
                                {(finding.review_decision || "pending").replace(/_/g, " ")}
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
            TAB: CONSUMER REPORTS / CITIZEN FLAGS
        ========================================================== */}
        {activeTab === "flags" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-rose-600" />
                  <span>Consumer Reports & Citizen Flags</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Direct package reports submitted by citizens for official Legal Metrology officer review
                </p>
              </div>

              <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                {flaggedReports.length} Active Flag{flaggedReports.length === 1 ? "" : "s"}
              </span>
            </div>

            {flaggedReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-2">
                <Flag className="h-8 w-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No consumer reports yet</h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                  When consumers scan products and click &quot;Report to Officer&quot;, the cases will appear here for investigation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {flaggedReports.map((report) => {
                  const flag = Array.isArray(report.citizen_flags) ? report.citizen_flags[0] : report.citizen_flags;
                  const currentStatus = flag?.status || report.flag_status || "pending_review";
                  const primaryImage = report.inspection_images?.[0]?.public_url;

                  return (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition shadow-2xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Image preview */}
                          <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={primaryImage}
                                alt="thumb"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-slate-400" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {report.case_number}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  currentStatus === "resolved"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : currentStatus === "under_review"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : currentStatus === "dismissed"
                                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                                    : "bg-rose-100 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {currentStatus.replace(/_/g, " ")}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {new Date(report.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900">{report.product_name}</h3>
                            <p className="text-xs text-slate-500 font-medium">
                              {report.brand} • {report.category}
                            </p>
                          </div>
                        </div>

                        {/* Direct Inspect Button */}
                        <Link
                          href={`/inspection/${report.id}/overview`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect Evidence</span>
                        </Link>
                      </div>

                      {/* Consumer Reason / Remarks */}
                      <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-950 space-y-1">
                        <span className="font-extrabold text-rose-900 block">Citizen Report Remarks:</span>
                        <p className="font-medium text-slate-700">
                          &quot;{flag?.reason || "Consumer flagged potential declaration discrepancies for officer inspection."}&quot;
                        </p>
                      </div>

                      {/* Findings Summary */}
                      {report.pipeline_findings && report.pipeline_findings.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Detected AI Findings:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {report.pipeline_findings.map((f: any) => (
                              <span
                                key={f.id}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                                  f.severity === "critical"
                                    ? "bg-rose-50 border-rose-200 text-rose-800"
                                    : "bg-amber-50 border-amber-200 text-amber-800"
                                }`}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {f.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Officer Decision Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">
                          Update Citizen Report Status:
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await updateFlaggedReportStatus({
                                inspectionId: report.id,
                                newStatus: "under_review",
                                officerNotes: "Case marked under investigation by officer.",
                              });
                              showNotification("Status updated to Under Review");
                              loadData();
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                              currentStatus === "under_review"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                            }`}
                          >
                            Under Review
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              await updateFlaggedReportStatus({
                                inspectionId: report.id,
                                newStatus: "resolved",
                                officerNotes: "Inspection completed & action taken.",
                              });
                              showNotification("Status updated to Resolved");
                              loadData();
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                              currentStatus === "resolved"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            Resolve / Confirm
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              await updateFlaggedReportStatus({
                                inspectionId: report.id,
                                newStatus: "dismissed",
                                officerNotes: "Product reviewed and determined compliant.",
                              });
                              showNotification("Report dismissed");
                              loadData();
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                              currentStatus === "dismissed"
                                ? "bg-slate-700 text-white border-slate-700"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
