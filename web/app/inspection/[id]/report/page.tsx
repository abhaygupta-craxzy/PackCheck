"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Download,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Building2,
  Calendar,
  Scale,
  Shield,
  Printer,
  Loader2,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceTabs } from "../overview/page";

// =========================================================================
// REPORT BUILDER PAGE
// =========================================================================

interface Finding {
  id: string;
  finding_number: string;
  severity: string;
  title: string;
  observed_value: string | null;
  expected_requirement: string;
  explanation: string;
  review_decision: string;
  investigator_notes: string | null;
  rule_id: string | null;
}

interface ExtractedField {
  id: string;
  field_name: string;
  field_label: string;
  raw_value: string | null;
  is_human_corrected: boolean;
  corrected_value: string | null;
  review_status: string;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [inspection, setInspection] = useState<Record<string, unknown> | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [profile, setProfile] = useState<{ full_name: string; designation: string; badge_number: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reportNumber, setReportNumber] = useState<string | null>(null);

  // Report editor state
  const [reportTitle, setReportTitle] = useState("Inspection Report — Legal Metrology (Packaged Commodities) Rules, 2011");
  const [officerObservation, setOfficerObservation] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const [inspRes, findRes, fieldsRes, profileRes] = await Promise.all([
      supabase.from("inspections").select("*").eq("id", id).single(),
      supabase.from("pipeline_findings").select("*").eq("inspection_id", id).order("finding_number"),
      supabase.from("extracted_fields").select("*").eq("inspection_id", id).order("field_name"),
      supabase.from("profiles").select("full_name,designation,badge_number").eq("id", user?.id ?? "").single(),
    ]);

    if (inspRes.error || !inspRes.data) {
      setInspection({
        id,
        case_number: id.startsWith("demo-") ? (id === "demo-001" ? "LM-2026-0842" : id === "demo-002" ? "LM-2026-0839" : "LM-2026-0835") : `LM-${new Date().getFullYear()}-0842`,
        product_name: id === "demo-002" ? "PureDrop Refined Mustard Oil 1 Litre" : "NutriSnack Roasted Almonds 200g",
        brand: id === "demo-002" ? "PureDrop Agro Mills" : "NutriSnack Foods Ltd.",
        category: id === "demo-002" ? "Edible Oils" : "Packaged Food",
        source_type: "physical_inspection",
      });
      setFields([
        { id: "f1", field_name: "mrp", field_label: "Maximum Retail Price (MRP)", raw_value: "₹ 199.00 (Incl. of all taxes)", is_human_corrected: false, corrected_value: null, review_status: "accepted" },
        { id: "f2", field_name: "net_quantity", field_label: "Net Quantity", raw_value: "200 g (Numeral height 2.2mm)", is_human_corrected: false, corrected_value: null, review_status: "pending" },
        { id: "f3", field_name: "manufacturing_date", field_label: "Month & Year of Manufacture", raw_value: "07/2026", is_human_corrected: false, corrected_value: null, review_status: "accepted" },
        { id: "f4", field_name: "manufacturer_name", field_label: "Manufacturer / Packer Details", raw_value: "NutriSnack Foods Ltd., Gujarat", is_human_corrected: false, corrected_value: null, review_status: "accepted" },
      ]);
      setFindings([
        { id: "find-1", finding_number: "PCR-2011-R7-01", severity: "warning", title: "Net Quantity Numeral Height Sub-Standard", observed_value: "2.2 mm", expected_requirement: "Minimum 4.0mm under Rule 7", explanation: "Numeral height less than mandatory standard.", review_decision: "confirmed_violation", investigator_notes: "Confirmed with physical vernier scale", rule_id: "Rule 7" },
        { id: "find-2", finding_number: "PCR-2011-R6-01", severity: "critical", title: "Unit Sale Price (USP) Missing", observed_value: "Absent", expected_requirement: "Mandatory under Rule 6(1)(h)", explanation: "Unit sale price not declared on PDP.", review_decision: "confirmed_violation", investigator_notes: "Non-compliant with GSR 711(E)", rule_id: "Rule 6(1)(h)" },
      ]);
      setOfficerObservation("Physical package inspected at retail warehouse in Mumbai. Net quantity numeral height verified to be 2.2mm, below the prescribed 4.0mm threshold for 200g packages under Table 1. Unit Sale Price is omitted from the principal display panel.");
      setConclusion("The commodity violates Rule 7(1) and Rule 6(1)(h) of the Legal Metrology (Packaged Commodities) Rules, 2011.");
      setRecommendedAction("Issue compounding notice under Section 48 / Show cause notice under Section 36(1) of the Legal Metrology Act, 2009.");
      setReportNumber(`RPT-LM-2026-0842-${Date.now().toString().slice(-4)}`);
      setIsLoading(false);
      return;
    }

    setInspection(inspRes.data);
    setFindings(findRes.data ?? []);
    setFields(fieldsRes.data ?? []);
    if (profileRes.data) setProfile(profileRes.data);

    // Check for existing report
    const { data: existingReport } = await supabase
      .from("pipeline_reports")
      .select("*")
      .eq("inspection_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingReport) {
      setReportNumber(existingReport.report_number);
      setIsSaved(!existingReport.is_draft);
      if (existingReport.blocks) {
        const blocks = existingReport.blocks as Array<{ type: string; content: string }>;
        const obs = blocks.find((b) => b.type === "observation");
        const conc = blocks.find((b) => b.type === "conclusion");
        const rec = blocks.find((b) => b.type === "recommendation");
        if (obs) setOfficerObservation(obs.content);
        if (conc) setConclusion(conc.content);
        if (rec) setRecommendedAction(rec.content);
      }
    }

    if (!existingReport) {
      const prodName = inspRes.data?.product_name || "Packaged Product";
      const brandName = inspRes.data?.brand || "Brand";
      const critCount = (findRes.data ?? []).filter((f: any) => f.severity === "critical").length;
      const warnCount = (findRes.data ?? []).filter((f: any) => f.severity === "warning").length;

      setReportNumber(`RPT-${inspRes.data?.case_number || `LM-2026-${id.slice(-4)}`}`);
      setOfficerObservation(
        `Physical package evidence for ${brandName} — ${prodName} inspected under the Legal Metrology (Packaged Commodities) Rules, 2011. Extracted mandatory declarations verified across Principal Display Panel (PDP) and package panels. ${critCount > 0 ? `${critCount} critical compliance violations identified.` : warnCount > 0 ? `${warnCount} standard observations identified.` : "All mandatory declarations verified."}`
      );
      setConclusion(
        critCount > 0
          ? `The packaged commodity requires enforcement rectification under Rule 6 and Rule 7 of the Legal Metrology (Packaged Commodities) Rules, 2011.`
          : "The package evidence satisfies mandatory declaration requirements under PCR 2011."
      );
      setRecommendedAction(
        critCount > 0
          ? "Issue compounding notice under Section 48 / Show cause notice under Section 36(1) of the Legal Metrology Act, 2009."
          : "Inspection verified and cleared for retail distribution."
      );
    }

    setIsLoading(false);
  }, [id, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // -----------------------------------------------------------------------

  const saveReport = async (finalize: boolean = false) => {
    if (!inspection) return;
    setIsSaving(true);

    const critFindings = findings.filter((f) => f.severity === "critical" && f.review_decision === "confirmed_violation");
    const warnFindings = findings.filter((f) => f.severity === "warning" && f.review_decision === "confirmed_violation");

    const overallStatus = critFindings.length > 0
      ? "non_compliant"
      : warnFindings.length > 0
      ? "requires_further_action"
      : "compliant";

    const blocks = [
      { type: "observation", content: officerObservation },
      { type: "conclusion", content: conclusion },
      { type: "recommendation", content: recommendedAction },
    ];

    const rNum = reportNumber ?? `RPT-${inspection.case_number}-${Date.now().toString().slice(-6)}`;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("pipeline_reports").upsert({
      inspection_id: id,
      report_number: rNum,
      title: reportTitle,
      generated_by: user?.id,
      ruleset_version: "PCR-India-2026",
      total_checks: findings.length,
      passed_count: findings.filter((f) => f.review_decision === "accepted_compliant").length,
      potential_issues_count: findings.filter((f) => f.review_decision === "confirmed_violation").length,
      overall_status: overallStatus,
      blocks,
      is_draft: !finalize,
      is_finalized: finalize,
      finalized_by: finalize ? user?.id : null,
      finalized_at: finalize ? new Date().toISOString() : null,
    }, { onConflict: "report_number" });

    if (!error) {
      setReportNumber(rNum);
      setIsSaved(finalize);
    }

    setIsSaving(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="packcheck-workspace-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-slate-500 mt-3">Loading report data...</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const confirmedViolations = findings.filter((f) => f.review_decision === "confirmed_violation");
  const acceptedCompliant = findings.filter((f) => f.review_decision === "accepted_compliant");
  const pendingReview = findings.filter((f) => f.review_decision === "pending");

  return (
    <div className="packcheck-workspace">
      <header className="packcheck-workspace-header">
        <div className="packcheck-workspace-nav">
          <Link href="/investigator" className="packcheck-back-btn">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <Link href={`/inspection/${id}/overview`} className="text-slate-500 hover:text-slate-700 text-sm">Overview</Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-700 font-medium text-sm">Report Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="packcheck-btn-secondary">
            <Printer className="h-4 w-4" />
            Print Preview
          </button>
          <button onClick={() => saveReport(false)} disabled={isSaving} className="packcheck-btn-secondary">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Save Draft
          </button>
          <button onClick={() => saveReport(true)} disabled={isSaving || isSaved} className="packcheck-btn-primary">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isSaved ? "Finalized" : "Finalize Report"}
          </button>
        </div>
      </header>

      <WorkspaceTabs inspectionId={id} activeTab="report" />

      <div className="packcheck-workspace-content">
        {pendingReview.length > 0 && (
          <div className="packcheck-report-warning">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800">{pendingReview.length} finding{pendingReview.length !== 1 ? "s" : ""} still pending review</p>
              <p className="text-sm text-amber-700">
                It is strongly recommended to review all findings before finalizing.{" "}
                <Link href={`/inspection/${id}/compliance`} className="underline font-medium">Go to Compliance Review →</Link>
              </p>
            </div>
          </div>
        )}

        {/* EDITABLE REPORT TITLE */}
        <div className="packcheck-section">
          <label className="packcheck-label">Report Title</label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="packcheck-input text-lg font-medium"
          />
        </div>

        {/* REPORT PREVIEW */}
        <div className="packcheck-report-document" id="packcheck-report-printable">
          {/* HEADER */}
          <div className="packcheck-report-header">
            <div className="packcheck-report-header-left">
              <div className="packcheck-report-gov-logo">
                <Shield className="h-8 w-8 text-blue-700" />
              </div>
              <div>
                <div className="packcheck-report-gov-title">GOVERNMENT OF INDIA</div>
                <div className="packcheck-report-gov-dept">Department for Consumer Affairs</div>
                <div className="packcheck-report-gov-sub">Legal Metrology Division</div>
              </div>
            </div>
            <div className="packcheck-report-header-right">
              {reportNumber && <div className="packcheck-report-number">Report No: <span className="font-mono">{reportNumber}</span></div>}
              <div className="packcheck-report-date">Date: {today}</div>
              <div className="packcheck-report-classification packcheck-badge packcheck-badge-amber">OFFICIAL USE ONLY</div>
            </div>
          </div>

          <div className="packcheck-report-title-block">
            <h1>{reportTitle}</h1>
            <p className="packcheck-report-subtitle">
              Legal Metrology (Packaged Commodities) Rules, 2011 (GSO 2688(E)) | Amended GSR 711(E), 2022
            </p>
          </div>

          {/* INSPECTION PARTICULARS */}
          <section className="packcheck-report-section">
            <h2 className="packcheck-report-section-title">1. Inspection Particulars</h2>
            <div className="packcheck-report-table">
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">Case Number</div>
                <div className="packcheck-report-val font-mono">{inspection?.case_number as string}</div>
              </div>
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">Product Name</div>
                <div className="packcheck-report-val">{inspection?.product_name as string}</div>
              </div>
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">Brand / Manufacturer</div>
                <div className="packcheck-report-val">{inspection?.brand as string}</div>
              </div>
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">Product Category</div>
                <div className="packcheck-report-val">{inspection?.category as string}</div>
              </div>
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">Inspection Source</div>
                <div className="packcheck-report-val capitalize">{String(inspection?.source_type ?? "").replace(/_/g, " ")}</div>
              </div>
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">Inspection Date</div>
                <div className="packcheck-report-val">{today}</div>
              </div>
              {profile && (
                <div className="packcheck-report-row">
                  <div className="packcheck-report-key">Inspecting Officer</div>
                  <div className="packcheck-report-val">
                    {profile.full_name}
                    {profile.designation && <span className="text-slate-500 ml-2">({profile.designation})</span>}
                    {profile.badge_number && <span className="text-slate-500 ml-2">Badge: {profile.badge_number}</span>}
                  </div>
                </div>
              )}
              <div className="packcheck-report-row">
                <div className="packcheck-report-key">AI Engine</div>
                <div className="packcheck-report-val">PackCheck AI (Gemini Vision + PCR 2011 Rules Engine v1.0)</div>
              </div>
            </div>
          </section>

          {/* DECLARATIONS TABLE */}
          <section className="packcheck-report-section">
            <h2 className="packcheck-report-section-title">2. Extracted Mandatory Declarations</h2>
            <div className="packcheck-report-declarations">
              <div className="packcheck-report-declarations-header">
                <div>Declaration Field</div>
                <div>Value Found on Package</div>
                <div>Review Status</div>
              </div>
              {fields.map((f) => (
                <div key={f.id} className="packcheck-report-declarations-row">
                  <div className="text-slate-700 font-medium">
                    {f.field_label ?? String(f.field_name).replace(/_/g, " ")}
                  </div>
                  <div className="text-slate-800">
                    {f.is_human_corrected ? f.corrected_value : f.raw_value ?? (
                      <span className="text-red-500 italic">Not detected</span>
                    )}
                    {f.is_human_corrected && (
                      <span className="ml-2 text-xs text-blue-500">(Investigator corrected)</span>
                    )}
                  </div>
                  <div>
                    <span className={`packcheck-badge ${f.review_status === "accepted" ? "packcheck-badge-green" : f.review_status === "rejected" ? "packcheck-badge-red" : "packcheck-badge-amber"}`}>
                      {f.review_status === "accepted" ? "Verified" : f.review_status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COMPLIANCE FINDINGS */}
          <section className="packcheck-report-section">
            <h2 className="packcheck-report-section-title">3. Compliance Analysis — Legal Metrology Rules</h2>

            <div className="packcheck-report-findings-summary">
              <div className="packcheck-rfs-item">
                <span className="packcheck-rfs-num text-red-600">{confirmedViolations.length}</span>
                <span className="packcheck-rfs-label">Confirmed Violations</span>
              </div>
              <div className="packcheck-rfs-item">
                <span className="packcheck-rfs-num text-emerald-600">{acceptedCompliant.length}</span>
                <span className="packcheck-rfs-label">Compliant</span>
              </div>
              <div className="packcheck-rfs-item">
                <span className="packcheck-rfs-num text-amber-600">{pendingReview.length}</span>
                <span className="packcheck-rfs-label">Pending Review</span>
              </div>
            </div>

            {findings.map((f) => {
              const sevIcon = f.severity === "critical" ? AlertOctagon : f.severity === "warning" ? AlertTriangle : Info;
              const SevIcon = sevIcon;
              const sevColor = f.severity === "critical" ? "text-red-600" : f.severity === "warning" ? "text-amber-600" : "text-blue-600";
              return (
                <div key={f.id} className="packcheck-report-finding-item">
                  <div className="packcheck-report-finding-header">
                    <SevIcon className={`h-4 w-4 ${sevColor}`} />
                    <span className="font-mono text-xs text-slate-400">{f.finding_number}</span>
                    <span className={`font-semibold ${sevColor}`}>{f.title}</span>
                    <span className="ml-auto">
                      <span className={`packcheck-badge ${f.review_decision === "confirmed_violation" ? "packcheck-badge-red" : f.review_decision === "accepted_compliant" ? "packcheck-badge-green" : "packcheck-badge-amber"}`}>
                        {String(f.review_decision).replace(/_/g, " ")}
                      </span>
                    </span>
                  </div>
                  <div className="packcheck-report-finding-body">
                    <div><span className="font-medium">Rule:</span> <span className="font-mono text-sm">{f.rule_id}</span></div>
                    {f.observed_value && <div><span className="font-medium">Observed:</span> {f.observed_value}</div>}
                    <div><span className="font-medium">Requirement:</span> {f.expected_requirement}</div>
                    <div className="text-slate-500">{f.explanation}</div>
                    {f.investigator_notes && (
                      <div className="packcheck-report-officer-note">
                        <span className="font-medium">Officer Note:</span> {f.investigator_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* OFFICER OBSERVATIONS */}
          <section className="packcheck-report-section">
            <h2 className="packcheck-report-section-title">4. Officer Observations</h2>
            <textarea
              value={officerObservation}
              onChange={(e) => setOfficerObservation(e.target.value)}
              className="packcheck-input packcheck-textarea packcheck-report-textarea"
              rows={5}
              placeholder="Enter your observations, physical measurements, market context, and any other relevant details..."
            />
          </section>

          {/* CONCLUSION */}
          <section className="packcheck-report-section">
            <h2 className="packcheck-report-section-title">5. Conclusion</h2>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="packcheck-input packcheck-textarea packcheck-report-textarea"
              rows={4}
              placeholder="Summarize your overall compliance conclusion based on AI analysis and physical inspection..."
            />
          </section>

          {/* RECOMMENDED ACTION */}
          <section className="packcheck-report-section">
            <h2 className="packcheck-report-section-title">6. Recommended Action</h2>
            <textarea
              value={recommendedAction}
              onChange={(e) => setRecommendedAction(e.target.value)}
              className="packcheck-input packcheck-textarea packcheck-report-textarea"
              rows={3}
              placeholder="e.g., Issue show cause notice under Section 36(1) | No action required | Refer for lab testing"
            />
          </section>

          {/* DISCLAIMER */}
          <div className="packcheck-report-disclaimer">
            <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              <span className="font-medium">Important Disclaimer:</span> This report is generated with AI-assisted analysis using the PackCheck platform. AI analysis is advisory and assistive only. All compliance determinations, enforcement decisions, and legal conclusions are the sole responsibility of the authorized Legal Metrology Officer who signs this report. AI cannot substitute for physical inspection, weighing, measurement, or legal judgment. This report does not constitute a legal notice, show cause notice, or enforcement action.
            </p>
          </div>

          {/* SIGNATURE BLOCK */}
          <div className="packcheck-report-signature">
            <div className="packcheck-signature-block">
              <div className="packcheck-signature-line" />
              <div className="packcheck-signature-name">{profile?.full_name ?? "Authorized Officer"}</div>
              <div className="packcheck-signature-title">{profile?.designation ?? "Legal Metrology Officer"}</div>
              {profile?.badge_number && <div className="packcheck-signature-badge">Badge No: {profile.badge_number}</div>}
              <div className="packcheck-signature-date">Date: {today}</div>
            </div>
            <div className="packcheck-signature-block">
              <div className="packcheck-signature-stamp">
                <Shield className="h-12 w-12 text-blue-200" />
                <div className="text-xs text-blue-300 mt-1 text-center">OFFICIAL SEAL</div>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE ACTIONS */}
        <div className="packcheck-workspace-actions">
          <button onClick={() => saveReport(false)} disabled={isSaving} className="packcheck-btn-secondary">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Save Draft
          </button>
          <button onClick={handlePrint} className="packcheck-btn-secondary">
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
          <button onClick={() => saveReport(true)} disabled={isSaving || isSaved} className="packcheck-btn-primary">
            {isSaved ? <><CheckCircle2 className="h-4 w-4" /> Report Finalized</> : <><Check className="h-4 w-4" /> Finalize Report</>}
          </button>
        </div>
      </div>
    </div>
  );
}
