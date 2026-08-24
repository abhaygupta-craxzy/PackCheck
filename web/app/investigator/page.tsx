"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  INITIAL_INSPECTIONS,
  DEMO_TEST_PACKAGES,
  InspectionCase,
  ComplianceFinding,
  DeclarationItem,
} from "@/lib/data";

export default function InvestigatorDashboard() {
  const [inspections, setInspections] = useState<InspectionCase[]>(INITIAL_INSPECTIONS);
  const [selectedCase, setSelectedCase] = useState<InspectionCase | null>(INITIAL_INSPECTIONS[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "inspections" | "rules" | "reports">("overview");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // New Inspection Modal State
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [newStep, setNewStep] = useState<number>(1);
  const [selectedSample, setSelectedSample] = useState(DEMO_TEST_PACKAGES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Inspector feedback notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Handle finding status update
  const updateFindingStatus = (findingId: string, newStatus: ComplianceFinding["status"]) => {
    if (!selectedCase) return;

    const updatedFindings = selectedCase.findings.map((f) =>
      f.id === findingId ? { ...f, status: newStatus } : f
    );

    const updatedCase = {
      ...selectedCase,
      findings: updatedFindings,
      status: updatedFindings.every((f) => f.status === "Confirmed" || f.status === "Dismissed")
        ? ("Verified" as const)
        : selectedCase.status,
    };

    setSelectedCase(updatedCase);
    setInspections((prev) =>
      prev.map((c) => (c.id === selectedCase.id ? updatedCase : c))
    );

    showNotification(`Finding ${findingId} marked as ${newStatus}`);
  };

  // Start simulated new inspection
  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setNewStep(3); // Go to results step
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Save new inspection into cases list
  const handleCompleteNewInspection = () => {
    const newCaseId = `LM-2026-08${Math.floor(40 + Math.random() * 50)}`;
    const newCase: InspectionCase = {
      id: newCaseId,
      productName: selectedSample.name,
      brand: selectedSample.brand,
      category: selectedSample.category as any,
      date: "24 Aug 2026",
      status: "Review Required",
      findingsCount: selectedSample.sampleIssues.length,
      declarationsCount: 6,
      reviewer: "Officer R. Sharma",
      confidenceScore: 95,
      evidenceImage: "scanned_package.jpg",
      declarations: [
        {
          id: "nd1",
          field: "Maximum Retail Price (MRP)",
          observedValue: selectedSample.simulatedMRP,
          confidence: 98,
          status: "verified",
          ruleReference: "PCR 2011 Rule 6(1)(e)",
          evidenceRegion: "Front label top",
        },
        {
          id: "nd2",
          field: "Net Quantity",
          observedValue: selectedSample.simulatedNetQty,
          confidence: 92,
          status: "flagged",
          ruleReference: "PCR 2011 Rule 7",
          evidenceRegion: "Front label bottom",
        },
        {
          id: "nd3",
          field: "Month & Year of Packaging",
          observedValue: selectedSample.simulatedMfg,
          confidence: 96,
          status: "verified",
          ruleReference: "PCR 2011 Rule 6(1)(d)",
          evidenceRegion: "Side crimp",
        },
      ],
      findings: selectedSample.sampleIssues.map((issue, idx) => ({
        id: `fn-${idx + 10}`,
        caseId: newCaseId,
        productName: selectedSample.name,
        category: selectedSample.category,
        severity: "warning",
        title: issue,
        observedValue: selectedSample.simulatedNetQty,
        expectedRequirement: "Must strictly comply with Legal Metrology (Packaged Commodities) Rules 2011",
        applicableRule: "Legal Metrology Packaged Commodities Rules 2011",
        reason: issue,
        evidenceRegion: "Principal Display Panel",
        confidence: 94,
        status: "Pending Review",
        date: "24 Aug 2026",
      })),
    };

    setInspections([newCase, ...inspections]);
    setSelectedCase(newCase);
    setIsNewInspectionOpen(false);
    setNewStep(1);
    showNotification(`New inspection ${newCaseId} created and added to review queue!`);
  };

  // Filtered list
  const filteredInspections = inspections.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* TOP COMMAND BAR (LIGHT THEME) */}
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

          {/* Quick Navigation Tabs */}
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
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                2
              </span>
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
          {/* Global New Inspection CTA */}
          <button
            onClick={() => {
              setNewStep(1);
              setIsNewInspectionOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Inspection</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => showNotification("No new high-priority notices. 2 items waiting in review queue.")}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold">
              RS
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-none text-slate-900">Officer R. Sharma</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Legal Metrology Inspector</p>
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

      {/* MAIN BODY CONTAINER */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">

        {/* =========================================================
            KPI CARDS ROW (LIGHT THEME)
        ========================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KPICard
            title="Total Inspections"
            value="128"
            subtitle="This month • +14% vs July"
            badge="Enforcement"
            badgeColor="blue"
            icon={<Scale className="h-5 w-5 text-blue-600" />}
          />
          <KPICard
            title="Pending Review"
            value="17"
            subtitle="Require investigator decision"
            badge="Action Required"
            badgeColor="amber"
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          />
          <KPICard
            title="Potential Violations"
            value="34"
            subtitle="Detected under PCR 2011"
            badge="Flagged"
            badgeColor="rose"
            icon={<AlertOctagon className="h-5 w-5 text-rose-600" />}
          />
          <KPICard
            title="Verified Findings"
            value="21"
            subtitle="Confirmed & docketed"
            badge="Legally Validated"
            badgeColor="emerald"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          />
        </section>

        {/* =========================================================
            WORKSPACE MAIN GRID: CASES & CASE DETAIL WORKBENCH
        ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: INSPECTIONS LIST & REVIEW QUEUE (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {activeTab === "queue" ? "Pending Review Queue" : "Active Inspections"}
                </h2>
                <p className="text-xs text-slate-500">Select a case to inspect evidence & record decisions</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-bold">
                {filteredInspections.length} cases
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search case ID, product, brand..."
                  className="w-full h-9 rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Categories</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Edible Oils">Edible Oils</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Beverages">Beverages</option>
              </select>
            </div>

            {/* Cases Card List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredInspections.map((item) => {
                const isSelected = selectedCase?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCase(item)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left shadow-xs ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                          {item.id}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">{item.date}</span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.brand} • {item.category}</p>

                    <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-3 text-slate-600 font-medium">
                        <span>OCR: <strong className="text-slate-900">{item.confidenceScore}%</strong></span>
                        <span>Findings: <strong className={item.findingsCount > 0 ? "text-amber-700" : "text-emerald-700"}>{item.findingsCount}</strong></span>
                      </div>
                      <span className="text-blue-700 flex items-center gap-0.5 text-[11px] font-bold">
                        Inspect <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: EVIDENCE & COMPLIANCE WORKBENCH (7 COLS) */}
          <div className="lg:col-span-7">
            {selectedCase ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm">
                {/* Header with Case Metadata */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{selectedCase.id}</span>
                      <StatusBadge status={selectedCase.status} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1.5">{selectedCase.productName}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Manufacturer/Brand: <span className="text-slate-800 font-semibold">{selectedCase.brand}</span> • Category: <span className="text-slate-800 font-semibold">{selectedCase.category}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showNotification(`Generating Official Legal Metrology Docket for ${selectedCase.id}...`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-500" />
                      <span>Print Docket</span>
                    </button>
                    <button
                      onClick={() => showNotification(`Exporting inspection report for ${selectedCase.id} as PDF`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>

                {/* Evidence & Bounding Box Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Package Preview Box */}
                  <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold mb-2">
                      <span className="font-mono flex items-center gap-1">
                        <ScanLine className="h-3.5 w-3.5 text-emerald-600" />
                        PACKAGE EVIDENCE
                      </span>
                      <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 text-[10px] font-bold">
                        OCR {selectedCase.confidenceScore}%
                      </span>
                    </div>

                    {/* Simulated Clean Package Visualizer */}
                    <div className="relative aspect-4/5 rounded-xl bg-white border border-slate-300 p-3.5 flex flex-col justify-between overflow-hidden shadow-xs">
                      {/* Scanning Line overlay */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />

                      <div className="space-y-1">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] font-mono font-bold text-emerald-700 border border-emerald-200">
                          PDP REGION #01
                        </span>
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                        <div className="h-2 w-1/2 rounded bg-slate-200" />
                      </div>

                      {/* Bounding box highlight */}
                      <div className="border-2 border-dashed border-amber-500 bg-amber-50 p-2 rounded-lg text-[10px] space-y-1">
                        <span className="font-bold text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600" /> Flagged Region
                        </span>
                        <p className="text-[9px] text-slate-700 font-medium">Net Quantity: 200g (Numeral: 2.2mm)</p>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-slate-200 text-[10px] text-slate-600 font-medium">
                        <p>MRP: ₹199.00 (Incl. Taxes)</p>
                        <p>Mfg: 07/2026</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium text-center mt-2">
                      Front + Back multi-angle evidentiary capture
                    </p>
                  </div>

                  {/* Extracted Declarations Table */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Extracted Mandatory Declarations
                      </h4>
                      <span className="text-[10px] text-slate-500 font-bold">PCR 2011 Rule 6</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {selectedCase.declarations.map((decl) => (
                        <div
                          key={decl.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-start justify-between gap-2 shadow-2xs"
                        >
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500">{decl.field}</p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{decl.observedValue}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{decl.ruleReference}</span>
                          </div>

                          <div className="text-right shrink-0">
                            {decl.status === "verified" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                                <Check className="h-3 w-3 text-emerald-600" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                <AlertTriangle className="h-3 w-3 text-amber-600" /> Flagged
                              </span>
                            )}
                            <p className="text-[9px] text-slate-500 font-medium mt-1">{decl.confidence}% conf.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* =====================================================
                    COMPLIANCE FINDINGS & INVESTIGATOR DECISION ACTIONS
                ====================================================== */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Potential Compliance Violations ({selectedCase.findings.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Deterministic rule engine evaluations requiring human inspector decision
                      </p>
                    </div>
                  </div>

                  {selectedCase.findings.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-900">No Potential Violations Detected</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">All mandatory Legal Metrology declarations conform to PCR 2011 standards.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCase.findings.map((finding) => (
                        <div
                          key={finding.id}
                          className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 text-xs space-y-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase">
                                  {finding.severity}
                                </span>
                                <h5 className="font-bold text-slate-900">{finding.title}</h5>
                              </div>
                              <p className="text-[11px] text-slate-700 font-medium mt-1.5">{finding.reason}</p>
                            </div>

                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white border border-slate-300 text-slate-700 font-bold shrink-0">
                              Status: {finding.status}
                            </span>
                          </div>

                          {/* Rule & Evidence reference box */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                            <div>
                              <span className="text-slate-500 block text-[10px] font-semibold">Observed Value:</span>
                              <span className="font-mono text-slate-900 font-bold">{finding.observedValue}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] font-semibold">Statutory Requirement:</span>
                              <span className="text-slate-900 font-semibold">{finding.expectedRequirement}</span>
                            </div>
                          </div>

                          {/* Human Investigator Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                            <span className="text-[10px] text-slate-600 font-medium">
                              Applicable: <strong className="text-slate-900 font-bold">{finding.applicableRule}</strong>
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateFindingStatus(finding.id, "Confirmed")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                              >
                                <Check className="h-3 w-3" /> Confirm Non-Compliance
                              </button>
                              <button
                                onClick={() => updateFindingStatus(finding.id, "Dismissed")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold shadow-xs transition cursor-pointer"
                              >
                                <X className="h-3 w-3" /> Dismiss Finding
                              </button>
                              <button
                                onClick={() => updateFindingStatus(finding.id, "Evidence Requested")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-bold transition cursor-pointer"
                              >
                                <MessageSquare className="h-3 w-3" /> Request Lab Audit
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] rounded-2xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-center p-8">
                <div>
                  <Scale className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No Case Selected</p>
                  <p className="text-xs text-slate-500 mt-1">Select an inspection case from the left list to view declarations & evidence.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* =========================================================
          NEW INSPECTION MODAL / WORKFLOW (LIGHT THEME)
      ========================================================== */}
      {isNewInspectionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Initiate Legal Metrology Inspection
                </h3>
                <p className="text-xs text-slate-500 font-medium">Step {newStep} of 3: {newStep === 1 ? "Select / Upload Evidence" : newStep === 2 ? "AI & Rule Engine Extraction" : "Review Inspection Docket"}</p>
              </div>
              <button
                onClick={() => setIsNewInspectionOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1: Choose Package Sample or Upload */}
            {newStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">
                  Select a test packaged commodity from the SIH 2026 test database or upload new label imagery:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {DEMO_TEST_PACKAGES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setSelectedSample(sample)}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-2xs ${
                        selectedSample.id === sample.id
                          ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/30"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-200">
                        {sample.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-2">{sample.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">{sample.brand}</p>
                    </button>
                  ))}
                </div>

                {/* Upload drag & drop zone mockup */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-2 hover:bg-slate-100/70 transition cursor-pointer">
                  <Upload className="h-6 w-6 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Or Drag & Drop Commodity Package Images</p>
                  <p className="text-[10px] text-slate-500 font-medium">Supports JPG, PNG, WEBP multi-angle front/back label captures (Max 25MB)</p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setIsNewInspectionOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setNewStep(2);
                      handleStartAnalysis();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                  >
                    <span>Analyze Package Evidence</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Simulated Analysis Engine */}
            {newStep === 2 && (
              <div className="py-8 space-y-6 text-center">
                <div className="relative flex items-center justify-center">
                  <RefreshCw className="h-12 w-12 text-emerald-600 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">Extracting Declarations & Testing Rules...</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Evaluating &quot;{selectedSample.name}&quot; against PCR 2011 Schedule II &amp; Rule 6
                  </p>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden max-w-md mx-auto border border-slate-200">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-[11px] text-slate-600 font-bold text-left">
                  <div className="flex items-center gap-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> OCR Extracted
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Rule Matched
                  </div>
                  <div className="flex items-center gap-1 text-amber-700">
                    <Clock className="h-3.5 w-3.5 text-amber-600" /> Ready for Review
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review Findings & Add to System */}
            {newStep === 3 && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 flex items-start gap-3 text-xs">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-950 font-bold">
                      {selectedSample.sampleIssues.length} Potential Issues Detected
                    </strong>
                    <p className="text-slate-700 text-[11px] font-medium mt-0.5">
                      The automated rule engine has flagged items for investigator verification.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedSample.sampleIssues.map((issue, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      <p className="font-bold text-rose-800">Flagged Issue #{idx + 1}</p>
                      <p className="text-slate-700 text-[11px] font-medium mt-0.5">{issue}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setIsNewInspectionOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleCompleteNewInspection}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Docket Inspection Case</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   HELPER SUB-COMPONENTS (LIGHT THEME)
================================================================ */

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
  badgeColor: "blue" | "amber" | "rose" | "emerald";
  icon: React.ReactNode;
}) {
  const badgeClasses = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  }[badgeColor];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 relative overflow-hidden shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{icon}</div>
      </div>

      <div>
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 font-medium">
        <span className="text-slate-500">{subtitle}</span>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${badgeClasses}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InspectionCase["status"] }) {
  const statusStyles = {
    "Review Required": "bg-amber-100 text-amber-900 border-amber-300",
    Verified: "bg-rose-100 text-rose-900 border-rose-300",
    Cleared: "bg-emerald-100 text-emerald-900 border-emerald-300",
    Processing: "bg-blue-100 text-blue-900 border-blue-300",
    "Report Generated": "bg-purple-100 text-purple-900 border-purple-300",
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusStyles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
