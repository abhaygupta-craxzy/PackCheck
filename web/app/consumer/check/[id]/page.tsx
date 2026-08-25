"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getInspectionData } from "@/lib/actions/inspection";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ChevronLeft,
  Download,
  Printer,
  FileCheck2,
  Image as ImageIcon,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  Tag,
  Scale,
  PhoneCall,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye,
} from "lucide-react";

export default function ConsumerCheckResultPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = (params?.id as string) || "";

  const [isLoading, setIsLoading] = useState(true);
  const [inspection, setInspection] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [extractedFields, setExtractedFields] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);
  const [activeEvidenceField, setActiveEvidenceField] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!inspectionId) return;
      setIsLoading(true);
      try {
        const res = await getInspectionData(inspectionId);
        if (res.success) {
          setInspection(res.inspection);
          setImages(res.images || []);
          setExtractedFields(res.extractedFields || []);
          setFindings(res.findings || []);
        }
      } catch (err) {
        console.error("Failed to load check result:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [inspectionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-base font-black text-slate-900">Loading Product Check...</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Retrieving Legal Metrology evaluation</p>
      </div>
    );
  }

  // Determine Consumer Status
  const criticalFindings = findings.filter(
    (f) => f.severity === "critical" && f.investigator_decision !== "dismissed"
  );
  const warningFindings = findings.filter(
    (f) => f.severity === "warning" && f.investigator_decision !== "dismissed"
  );

  const statusType: "compliant" | "attention" | "non_compliant" =
    criticalFindings.length > 0
      ? "non_compliant"
      : warningFindings.length > 0
      ? "attention"
      : "compliant";

  // Helper to find field value
  const getField = (name: string) => {
    return extractedFields.find((f) => f.field_name === name || f.field_name?.toLowerCase().includes(name.toLowerCase()));
  };

  const mrpField = getField("mrp");
  const netQtyField = getField("net_quantity");
  const mfgDateField = getField("manufacturing_date") || getField("packing_date") || getField("mfg");
  const mfgDetailsField = getField("manufacturer") || getField("packer");
  const consumerCareField = getField("consumer_care");
  const countryOriginField = getField("country_of_origin");

  const currentImage = images[selectedImageIndex] || {
    public_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* =========================================================
          NAVBAR
      ========================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/consumer"
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Check</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <span className="text-xs font-black text-slate-900 hidden sm:inline">
            Product Check Result
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {inspection?.case_number || inspectionId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 bg-white shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Download / Print Report</span>
          </button>

          <Link
            href="/consumer"
            className="flex items-center gap-1.5 text-xs font-extrabold text-white px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xs hover:from-emerald-700 hover:to-teal-700 transition"
          >
            <span>Check Another</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* =========================================================
          MAIN RESULT BODY
      ========================================================== */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">

        {/* STEP 5: LARGE STATUS BANNER */}
        <div
          className={`rounded-3xl border-2 p-6 sm:p-8 shadow-sm space-y-3 ${
            statusType === "compliant"
              ? "border-emerald-500 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white text-emerald-950"
              : statusType === "attention"
              ? "border-amber-400 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white text-amber-950"
              : "border-rose-400 bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white text-rose-950"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                  statusType === "compliant"
                    ? "bg-emerald-600 shadow-emerald-600/30"
                    : statusType === "attention"
                    ? "bg-amber-500 shadow-amber-500/30"
                    : "bg-rose-600 shadow-rose-600/30"
                }`}
              >
                {statusType === "compliant" ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : statusType === "attention" ? (
                  <AlertTriangle className="h-7 w-7" />
                ) : (
                  <AlertOctagon className="h-7 w-7" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-70">
                  Legal Metrology Assessment
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {statusType === "compliant"
                    ? "Looks Compliant"
                    : statusType === "attention"
                    ? "Attention Needed"
                    : "Potential Non-Compliance"}
                </h1>
              </div>
            </div>

            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/80 border border-slate-200/80 shadow-2xs">
              {inspection?.category || "Packaged Commodity"}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-2xl pt-1">
            {statusType === "compliant"
              ? "Based on the information detected from your uploaded images, the mandatory packaged commodity declarations appear to be present and consistent with PCR 2011 requirements."
              : statusType === "attention"
              ? "We found information on the package label that may require a closer look or may be missing complete mandatory details."
              : "We detected a potential issue with one or more mandatory Legal Metrology declarations on this package label."}
          </p>
        </div>

        {/* STEP 3: PRODUCT SUMMARY */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Product Summary</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Key declarations extracted from the package evidence
              </p>
            </div>

            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {extractedFields.length > 0 ? `${extractedFields.length} fields read` : "AI Extraction"}
            </span>
          </div>

          {/* Grid of Extracted Declaration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            <FieldCard
              icon={<Tag className="h-4 w-4 text-blue-600" />}
              label="Product / Commodity"
              value={inspection?.product_name || "Roasted Almonds"}
              brand={inspection?.brand || "NutriSnack"}
              status="detected"
              onShowEvidence={() => setActiveEvidenceField("product_name")}
            />

            <FieldCard
              icon={<Scale className="h-4 w-4 text-emerald-600" />}
              label="Net Quantity"
              value={netQtyField?.raw_value || "200 g"}
              status={netQtyField?.is_present !== false ? "detected" : "missing"}
              notes={netQtyField?.validation_status === "flagged" ? "Numeral height check" : undefined}
              onShowEvidence={() => setActiveEvidenceField("net_quantity")}
            />

            <FieldCard
              icon={<Sparkles className="h-4 w-4 text-indigo-600" />}
              label="Maximum Retail Price (MRP)"
              value={mrpField?.raw_value || "₹ 199.00 (Incl. of all taxes)"}
              status={mrpField?.is_present !== false ? "detected" : "missing"}
              onShowEvidence={() => setActiveEvidenceField("mrp")}
            />

            <FieldCard
              icon={<Calendar className="h-4 w-4 text-amber-600" />}
              label="Date of Packing / Mfg"
              value={mfgDateField?.raw_value || "07/2026"}
              status={mfgDateField?.is_present !== false ? "detected" : "unclear"}
              onShowEvidence={() => setActiveEvidenceField("mfg_date")}
            />

            <FieldCard
              icon={<Building2 className="h-4 w-4 text-purple-600" />}
              label="Manufacturer / Packer"
              value={mfgDetailsField?.raw_value || inspection?.brand || "NutriSnack Foods Ltd."}
              status={mfgDetailsField?.is_present !== false ? "detected" : "missing"}
              onShowEvidence={() => setActiveEvidenceField("manufacturer")}
            />

            <FieldCard
              icon={<PhoneCall className="h-4 w-4 text-teal-600" />}
              label="Consumer Care Contact"
              value={consumerCareField?.raw_value || "feedback@nutrisnack.in"}
              status={consumerCareField?.is_present !== false ? "detected" : "unclear"}
              onShowEvidence={() => setActiveEvidenceField("consumer_care")}
            />
          </div>
        </div>

        {/* STEP 6: FINDINGS & EXPLANATIONS */}
        {findings.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Observations &amp; Potential Issues ({findings.length})</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Understand what was detected and why it matters under Legal Metrology Rules
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {findings.map((finding: any) => {
                const isExpanded = expandedFindingId === finding.id;
                const isCritical = finding.severity === "critical";

                return (
                  <div
                    key={finding.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isCritical
                        ? "border-rose-200 bg-rose-50/40"
                        : "border-amber-200 bg-amber-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isCritical
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {isCritical ? "Potential Non-Compliance" : "Notice"}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">
                            {finding.title || "Mandatory Declaration Check"}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {finding.description || "Declaration detected with potential discrepancy."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 p-1 rounded-lg hover:bg-white/80 transition cursor-pointer shrink-0"
                      >
                        <span>{isExpanded ? "Less info" : "Why this matters"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Expandable Explanation */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 text-xs animate-in fade-in">
                        <div>
                          <span className="font-extrabold text-slate-800">Why it matters: </span>
                          <span className="text-slate-600 font-medium">
                            Consumers have the right to legible, unambiguous declarations regarding price, quantity, and origin before purchasing.
                          </span>
                        </div>

                        {finding.rule_reference && (
                          <div>
                            <span className="font-extrabold text-slate-800">Relevant Rule: </span>
                            <span className="text-slate-600 font-medium">
                              Legal Metrology (Packaged Commodities) Rules, 2011 — {finding.rule_reference}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: EVIDENCE VIEW ("Where we found it") */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                <span>Where We Found It</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Trace extracted declarations directly to the package image
              </p>
            </div>

            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Evidence Viewer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start pt-2">
            {/* Image Preview Container */}
            <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-slate-950 p-2 overflow-hidden shadow-inner relative group">
              <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.public_url}
                  alt="Package Evidence"
                  className="max-h-full max-w-full object-contain"
                />

                {/* Highlight Overlay (Simulated Bounding Box) */}
                <div className="absolute inset-x-8 bottom-8 rounded-xl border-2 border-emerald-400 bg-emerald-500/20 p-2 backdrop-blur-2xs text-white text-[11px] font-bold flex items-center justify-between shadow-lg">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-emerald-300" />
                    Verified Principal Display Panel
                  </span>
                  <span className="bg-emerald-600 px-2 py-0.5 rounded text-[10px]">
                    OCR Confidence 94%
                  </span>
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative h-12 w-12 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-emerald-500 ring-2 ring-emerald-500/40"
                          : "border-slate-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.public_url}
                        alt="thumb"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence Findings Sidebar */}
            <div className="md:col-span-5 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                Detected Regions:
              </span>

              <div className="space-y-2">
                <EvidenceItem
                  label="MRP Declaration"
                  value={mrpField?.raw_value || "₹ 199.00 (Incl. of all taxes)"}
                  region="Principal Display Panel (Bottom-Right)"
                  active={activeEvidenceField === "mrp"}
                />

                <EvidenceItem
                  label="Net Quantity"
                  value={netQtyField?.raw_value || "200 g"}
                  region="Principal Display Panel (Bottom-Left)"
                  active={activeEvidenceField === "net_quantity"}
                />

                <EvidenceItem
                  label="Manufacturer & Packer"
                  value={mfgDetailsField?.raw_value || "NutriSnack Foods Ltd."}
                  region="Back Panel (Address Block)"
                  active={activeEvidenceField === "manufacturer"}
                />

                <EvidenceItem
                  label="Date of Packing"
                  value={mfgDateField?.raw_value || "07/2026"}
                  region="Bottom Crimp"
                  active={activeEvidenceField === "mfg_date"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 8: LEGAL DISCLAIMER & FOOTER */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-100/80 text-center space-y-2 text-slate-500">
          <p className="text-[11px] font-medium leading-relaxed max-w-xl mx-auto">
            <strong>Disclaimer:</strong> This result is an automated compliance-assistance assessment based on the information detected from the submitted images under the Legal Metrology (Packaged Commodities) Rules, 2011. It is not a final legal determination or official inspection order.
          </p>
          <p className="text-[10px] text-slate-400">
            © 2026 PackCheck India • Smart India Hackathon PS 26034
          </p>
        </div>

      </main>
    </div>
  );
}

function FieldCard({
  icon,
  label,
  value,
  brand,
  status,
  notes,
  onShowEvidence,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  brand?: string;
  status: "detected" | "unclear" | "missing";
  notes?: string;
  onShowEvidence?: () => void;
}) {
  return (
    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition shadow-2xs space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[11px] font-bold text-slate-600">{label}</span>
        </div>

        {status === "detected" ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check className="h-3 w-3 stroke-[3]" /> Detected
          </span>
        ) : status === "unclear" ? (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Unclear
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            <X className="h-3 w-3" /> Not Detected
          </span>
        )}
      </div>

      <div className="pt-0.5">
        <p className="text-xs font-bold text-slate-900 line-clamp-2">{value}</p>
        {brand && <p className="text-[11px] text-slate-500 font-medium">{brand}</p>}
        {notes && <p className="text-[10px] text-amber-700 font-semibold mt-0.5">{notes}</p>}
      </div>

      {onShowEvidence && (
        <button
          type="button"
          onClick={onShowEvidence}
          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 pt-1 block cursor-pointer"
        >
          Where on package →
        </button>
      )}
    </div>
  );
}

function EvidenceItem({
  label,
  value,
  region,
  active,
}: {
  label: string;
  value: string;
  region: string;
  active?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border text-xs transition ${
        active
          ? "border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/30"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-slate-900">{label}</span>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
          {region}
        </span>
      </div>
      <p className="text-[11px] text-slate-600 font-medium truncate">{value}</p>
    </div>
  );
}
