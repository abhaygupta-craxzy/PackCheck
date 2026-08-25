"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  FileText,
  Eye,
  Package,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  Activity,
  Scale,
  Layers,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// =========================================================================
// OVERVIEW PAGE
// =========================================================================

export default function InspectionOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [inspection, setInspection] = useState<Record<string, unknown> | null>(null);
  const [images, setImages] = useState<Record<string, unknown>[]>([]);
  const [fields, setFields] = useState<Record<string, unknown>[]>([]);
  const [findings, setFindings] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [inspRes, imagesRes, fieldsRes, findingsRes, eventsRes] = await Promise.all([
        supabase.from("inspections").select("*").eq("id", id).single(),
        supabase.from("inspection_images").select("*").eq("inspection_id", id).order("created_at"),
        supabase.from("extracted_fields").select("*").eq("inspection_id", id).order("field_name"),
        supabase.from("pipeline_findings").select("*").eq("inspection_id", id).order("finding_number"),
        supabase.from("processing_events").select("*").eq("inspection_id", id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (inspRes.error || !inspRes.data) {
        // Fallback for demo cases or unpersisted preview IDs
        setInspection({
          id,
          case_number: id.startsWith("demo-") ? (id === "demo-001" ? "LM-2026-0842" : id === "demo-002" ? "LM-2026-0839" : "LM-2026-0835") : `LM-${new Date().getFullYear()}-0842`,
          product_name: id === "demo-002" ? "PureDrop Refined Mustard Oil 1 Litre" : id === "demo-003" ? "SunGlow Intensive Night Moisturizer 50g" : "NutriSnack Roasted Almonds 200g",
          brand: id === "demo-002" ? "PureDrop Agro Mills" : id === "demo-003" ? "SunGlow Derma Labs" : "NutriSnack Foods Ltd.",
          category: id === "demo-002" ? "Edible Oils" : id === "demo-003" ? "Cosmetics" : "Packaged Food",
          status: id === "demo-003" ? "cleared" : id === "demo-002" ? "verified" : "review_required",
          source_type: "physical_inspection",
          overall_confidence_score: 94,
          created_at: new Date().toISOString(),
          location_coordinates: { city: "Mumbai, Maharashtra" },
        });
        setFields([
          { id: "f1", field_name: "mrp", field_label: "Maximum Retail Price (MRP)", raw_value: "₹ 199.00 (Incl. of all taxes)", confidence_score: 98, review_status: "accepted", is_human_corrected: false },
          { id: "f2", field_name: "net_quantity", field_label: "Net Quantity", raw_value: "200 g (Numeral height 2.2mm)", confidence_score: 81, review_status: "pending", is_human_corrected: false },
          { id: "f3", field_name: "manufacturing_date", field_label: "Month & Year of Manufacture", raw_value: "07/2026", confidence_score: 98, review_status: "accepted", is_human_corrected: false },
          { id: "f4", field_name: "manufacturer_name", field_label: "Manufacturer Details", raw_value: "NutriSnack Foods Ltd., Gujarat", confidence_score: 94, review_status: "accepted", is_human_corrected: false },
        ]);
        setFindings([
          { id: "find-1", finding_number: "PCR-2011-R7-01", title: "Net Quantity Numeral Height Sub-Standard", severity: "warning", explanation: "Rule 7 Table 1 requires minimum 4.0mm height for 200g net quantity. Observed: 2.2mm.", review_decision: "pending" },
          { id: "find-2", finding_number: "PCR-2011-R6-01", title: "Unit Sale Price (USP) Declaration Missing", severity: "critical", explanation: "Mandatory Unit Sale Price not detected on principal display panel under GSR 711(E).", review_decision: "pending" },
        ]);
        setEvents([
          { id: "e1", stage: "ocr", status: "completed", message: "Gemini Vision extracted 8 declarations (94% conf)", created_at: new Date().toISOString() },
          { id: "e2", stage: "compliance", status: "completed", message: "PCR 2011 compliance evaluation finished with 2 findings", created_at: new Date().toISOString() },
        ]);
        return;
      }

      setInspection(inspRes.data);
      setImages(imagesRes.data ?? []);
      setFields(fieldsRes.data ?? []);
      setFindings(findingsRes.data ?? []);
      setEvents(eventsRes.data ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="packcheck-workspace-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-slate-500 mt-3">Loading inspection data...</p>
      </div>
    );
  }

  if (!inspection) return null;

  const statusMap: Record<string, { label: string; color: string }> = {
    review_required: { label: "Review Required", color: "text-amber-600 bg-amber-50 border-amber-200" },
    processing: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-200" },
    verified: { label: "Verified", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    cleared: { label: "Cleared", color: "text-slate-600 bg-slate-50 border-slate-200" },
    non_compliant: { label: "Non-Compliant", color: "text-red-600 bg-red-50 border-red-200" },
    report_generated: { label: "Report Ready", color: "text-violet-600 bg-violet-50 border-violet-200" },
    draft: { label: "Draft", color: "text-slate-500 bg-slate-50 border-slate-200" },
  };

  const status = statusMap[inspection.status as string] ?? { label: String(inspection.status), color: "text-slate-600 bg-slate-50 border-slate-200" };
  
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const warningFindings = findings.filter((f) => f.severity === "warning");
  const presentFields = fields.filter((f) => f.raw_value);
  const confidence = inspection.overall_confidence_score as number | null;

  return (
    <div className="packcheck-workspace">
      {/* WORKSPACE HEADER */}
      <header className="packcheck-workspace-header">
        <div className="packcheck-workspace-nav">
          <Link href="/dashboard" className="packcheck-back-btn">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-700 font-medium font-mono text-sm">{inspection.case_number as string}</span>
        </div>
        <button onClick={loadData} className="packcheck-icon-btn" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      {/* WORKSPACE TABS */}
      <WorkspaceTabs inspectionId={id} activeTab="overview" />

      {/* CONTENT */}
      <div className="packcheck-workspace-content">
        {/* CASE HEADER */}
        <div className="packcheck-case-header">
          <div className="packcheck-case-title-row">
            <div>
              <h1 className="packcheck-case-title">{inspection.product_name as string}</h1>
              <p className="packcheck-case-brand">{inspection.brand as string} · {inspection.category as string}</p>
            </div>
            <span className={`packcheck-status-badge text-sm px-3 py-1.5 ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="packcheck-case-meta">
            <div className="packcheck-case-meta-item">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-sm font-semibold">{inspection.case_number as string}</span>
            </div>
            <div className="packcheck-case-meta-item">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{new Date(inspection.created_at as string).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            {typeof (inspection.location_coordinates as Record<string, unknown> | null)?.city === "string" && (
              <div className="packcheck-case-meta-item">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{String((inspection.location_coordinates as Record<string, unknown>).city)}</span>
              </div>
            )}
            {inspection.marketplace_url ? (
              <a href={String(inspection.marketplace_url)} target="_blank" rel="noopener noreferrer" className="packcheck-case-meta-item packcheck-case-meta-link">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600">View Listing</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="packcheck-overview-grid">
          <div className="packcheck-overview-card packcheck-ov-blue">
            <div className="packcheck-ov-icon">
              <Layers className="h-5 w-5" />
            </div>
            <div className="packcheck-ov-value">{presentFields.length}</div>
            <div className="packcheck-ov-label">Fields Extracted</div>
            <div className="packcheck-ov-sub">of {fields.length} total</div>
          </div>

          <div className="packcheck-overview-card packcheck-ov-red">
            <div className="packcheck-ov-icon">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div className="packcheck-ov-value">{criticalFindings.length}</div>
            <div className="packcheck-ov-label">Critical Issues</div>
            <div className="packcheck-ov-sub">Require immediate review</div>
          </div>

          <div className="packcheck-overview-card packcheck-ov-amber">
            <div className="packcheck-ov-icon">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="packcheck-ov-value">{warningFindings.length}</div>
            <div className="packcheck-ov-label">Warnings</div>
            <div className="packcheck-ov-sub">Flagged for review</div>
          </div>

          <div className="packcheck-overview-card packcheck-ov-slate">
            <div className="packcheck-ov-icon">
              <Activity className="h-5 w-5" />
            </div>
            <div className="packcheck-ov-value">{confidence !== null ? `${Math.round(confidence)}%` : "—"}</div>
            <div className="packcheck-ov-label">AI Confidence</div>
            <div className="packcheck-ov-sub">Extraction quality</div>
          </div>
        </div>

        {/* EVIDENCE IMAGES */}
        {images.length > 0 && (
          <div className="packcheck-section">
            <div className="packcheck-section-header">
              <h2 className="packcheck-section-title">Evidence Images</h2>
              <Link href={`/inspection/${id}/evidence`} className="packcheck-section-link">
                View annotated <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="packcheck-evidence-thumbnails">
              {images.map((img) => (
                <div key={img.id as string} className="packcheck-evidence-thumb">
                  {img.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.public_url as string} alt={img.image_type as string} className="packcheck-evidence-thumb-img" />
                  ) : (
                    <div className="packcheck-evidence-thumb-placeholder">
                      <Package className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                  <div className="packcheck-evidence-thumb-label capitalize">
                    {(img.image_type as string).replace("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXTRACTED DECLARATIONS */}
        {fields.length > 0 && (
          <div className="packcheck-section">
            <div className="packcheck-section-header">
              <h2 className="packcheck-section-title">Extracted Declarations</h2>
              <Link href={`/inspection/${id}/evidence`} className="packcheck-section-link">
                Edit <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="packcheck-declarations-table">
              <div className="packcheck-declarations-header">
                <div>Field</div>
                <div>Extracted Value</div>
                <div>Confidence</div>
                <div>Status</div>
              </div>
              {fields.map((f) => (
                <div key={f.id as string} className="packcheck-declarations-row">
                  <div className="packcheck-decl-field">{f.field_label as string ?? String(f.field_name).replace(/_/g, " ")}</div>
                  <div className="packcheck-decl-value">
                    {f.is_human_corrected ? (
                      <span className="packcheck-corrected">{f.corrected_value as string}</span>
                    ) : (
                      f.raw_value ? <span>{f.raw_value as string}</span> : <span className="text-slate-400 italic">Not detected</span>
                    )}
                  </div>
                  <div className="packcheck-decl-confidence">
                    {f.raw_value ? (
                      <div className="packcheck-confidence-bar-wrapper">
                        <div className="packcheck-confidence-bar">
                          <div
                            className={`packcheck-confidence-fill ${Number(f.confidence_score) >= 80 ? "packcheck-conf-high" : Number(f.confidence_score) >= 50 ? "packcheck-conf-medium" : "packcheck-conf-low"}`}
                            style={{ width: `${f.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{Math.round(Number(f.confidence_score))}%</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div>
                    {f.is_human_corrected ? (
                      <span className="packcheck-badge packcheck-badge-blue">Human Corrected</span>
                    ) : f.raw_value ? (
                      <span className="packcheck-badge packcheck-badge-slate">AI Extracted</span>
                    ) : (
                      <span className="packcheck-badge packcheck-badge-red">Not Detected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FINDINGS SUMMARY */}
        {findings.length > 0 && (
          <div className="packcheck-section">
            <div className="packcheck-section-header">
              <h2 className="packcheck-section-title">Compliance Findings</h2>
              <Link href={`/inspection/${id}/compliance`} className="packcheck-section-link">
                Review all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="packcheck-findings-list">
              {findings.slice(0, 5).map((f) => {
                const sev = f.severity as string;
                const sevColor =
                  sev === "critical" ? "text-red-600 bg-red-50 border-red-200" :
                  sev === "warning" ? "text-amber-600 bg-amber-50 border-amber-200" :
                  "text-slate-500 bg-slate-50 border-slate-200";
                return (
                  <div key={f.id as string} className="packcheck-finding-row">
                    <div className={`packcheck-finding-sev ${sevColor}`}>
                      {sev === "critical" ? <AlertOctagon className="h-4 w-4" /> :
                       sev === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                       <CheckCircle2 className="h-4 w-4" />}
                      <span className="capitalize">{sev}</span>
                    </div>
                    <div className="packcheck-finding-info">
                      <div className="packcheck-finding-title">{f.title as string}</div>
                      <div className="packcheck-finding-exp text-slate-500 text-sm">{(f.explanation as string).slice(0, 120)}{(f.explanation as string).length > 120 ? "…" : ""}</div>
                    </div>
                    <div className={`packcheck-badge ${f.review_decision === "pending" ? "packcheck-badge-amber" : "packcheck-badge-slate"}`}>
                      {f.review_decision === "pending" ? "Pending Review" : String(f.review_decision).replace(/_/g, " ")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PROCESSING EVENTS */}
        {events.length > 0 && (
          <div className="packcheck-section">
            <h2 className="packcheck-section-title mb-4">Processing Log</h2>
            <div className="packcheck-events-list">
              {events.map((e) => (
                <div key={e.id as string} className="packcheck-event-item">
                  <div className={`packcheck-event-dot ${e.status === "completed" ? "packcheck-event-done" : e.status === "failed" ? "packcheck-event-fail" : "packcheck-event-info"}`} />
                  <div className="packcheck-event-info">
                    {Boolean(e.message) && <span className="text-slate-500 text-sm ml-2">{String(e.message)}</span>}
                  </div>
                  <div className="packcheck-event-time text-xs text-slate-400">
                    {new Date(e.created_at as string).toLocaleTimeString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="packcheck-workspace-actions">
          <Link href={`/inspection/${id}/evidence`} className="packcheck-btn-primary">
            <Eye className="h-4 w-4" />
            Review Evidence
          </Link>
          <Link href={`/inspection/${id}/compliance`} className="packcheck-btn-amber">
            <Scale className="h-4 w-4" />
            Compliance Review
          </Link>
          <Link href={`/inspection/${id}/report`} className="packcheck-btn-secondary">
            <FileText className="h-4 w-4" />
            Generate Report
          </Link>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// WORKSPACE TABS COMPONENT (shared across all workspace pages)
// =========================================================================

export function WorkspaceTabs({ inspectionId, activeTab }: { inspectionId: string; activeTab: string }) {
  const tabs = [
    { key: "overview", label: "Overview", href: `/inspection/${inspectionId}/overview`, icon: Package },
    { key: "evidence", label: "Evidence", href: `/inspection/${inspectionId}/evidence`, icon: Eye },
    { key: "compliance", label: "Compliance", href: `/inspection/${inspectionId}/compliance`, icon: Scale },
    { key: "report", label: "Report", href: `/inspection/${inspectionId}/report`, icon: FileText },
  ];

  return (
    <nav className="packcheck-workspace-tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`packcheck-workspace-tab ${activeTab === tab.key ? "packcheck-workspace-tab-active" : ""}`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
