"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  Scale,
  Check,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceTabs } from "../overview/page";
import { runComplianceAnalysis } from "@/lib/actions/inspection";

// =========================================================================
// COMPLIANCE REVIEW PAGE
// =========================================================================

interface Finding {
  id: string;
  finding_number: string;
  category: string;
  severity: "critical" | "warning" | "advisory" | "compliant";
  status: string;
  title: string;
  observed_value: string | null;
  expected_requirement: string;
  explanation: string;
  ai_confidence_score: number | null;
  ruleset_version: string;
  review_decision: string;
  investigator_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rule_id: string | null;
}

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    icon: AlertOctagon,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "packcheck-badge-red",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "packcheck-badge-amber",
  },
  advisory: {
    label: "Advisory",
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "packcheck-badge-blue",
  },
  compliant: {
    label: "Compliant",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "packcheck-badge-green",
  },
};

const DECISION_CONFIG = {
  pending: { label: "Pending Review", color: "packcheck-badge-amber" },
  confirmed_violation: { label: "Confirmed Violation", color: "packcheck-badge-red" },
  accepted_compliant: { label: "Accepted — Compliant", color: "packcheck-badge-green" },
  rejected: { label: "Rejected", color: "packcheck-badge-slate" },
  needs_further_inspection: { label: "Further Inspection Needed", color: "packcheck-badge-blue" },
  dismissed: { label: "Dismissed", color: "packcheck-badge-slate" },
};

export default function CompliancePage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [inspection, setInspection] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [noteValue, setNoteValue] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [inspRes, findRes] = await Promise.all([
      supabase.from("inspections").select("*").eq("id", id).single(),
      supabase.from("pipeline_findings").select("*").eq("inspection_id", id).order("finding_number"),
    ]);

    if (inspRes.error || !inspRes.data) {
      setInspection({
        id,
        product_name: id === "demo-002" ? "PureDrop Refined Mustard Oil 1 Litre" : "NutriSnack Roasted Almonds 200g",
        brand: id === "demo-002" ? "PureDrop Agro Mills" : "NutriSnack Foods Ltd.",
        category: id === "demo-002" ? "Edible Oils" : "Packaged Food",
      });
      setFindings([
        {
          id: "find-1",
          finding_number: "PCR-2011-R7-01",
          category: "Net Quantity Declaration",
          severity: "warning",
          status: "requires_review",
          title: "Net Quantity Numeral Height Sub-Standard",
          observed_value: "2.2 mm (Declared Net Qty: 200g)",
          expected_requirement: "Rule 7 Table 1 specifies minimum 4.0mm numeral height for 200g-500g packages.",
          explanation: "Perception detected numeral height below prescribed threshold.",
          ai_confidence_score: 92,
          ruleset_version: "PCR-India-2026",
          review_decision: "pending",
          investigator_notes: null,
          reviewed_by: null,
          reviewed_at: null,
          rule_id: "Rule 7",
        },
        {
          id: "find-2",
          finding_number: "PCR-2011-R6-01",
          category: "Unit Sale Price",
          severity: "critical",
          status: "potential_non_compliance",
          title: "Unit Sale Price (USP) Missing",
          observed_value: "Not detected on principal display panel",
          expected_requirement: "Rule 6(1)(h) requires mandatory Unit Sale Price declaration under GSR 711(E).",
          explanation: "Mandatory declaration missing from principal display panel.",
          ai_confidence_score: 96,
          ruleset_version: "PCR-India-2026",
          review_decision: "pending",
          investigator_notes: null,
          reviewed_by: null,
          reviewed_at: null,
          rule_id: "Rule 6(1)(h)",
        },
      ]);
      setIsLoading(false);
      return;
    }

    setInspection(inspRes.data);
    setFindings(findRes.data ?? []);
    setIsLoading(false);
  }, [id, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateDecision = async (finding: Finding, decision: string, notes: string) => {
    setSavingId(finding.id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("pipeline_findings").update({
      review_decision: decision,
      investigator_notes: notes,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", finding.id);

    setSaveMsg("Decision saved");
    setTimeout(() => setSaveMsg(null), 2500);
    setSavingId(null);
    await loadData();
  };

  const handleReanalysis = async () => {
    if (!inspection) return;
    setIsReanalysing(true);
    await runComplianceAnalysis(id, inspection.category as string);
    await loadData();
    setIsReanalysing(false);
  };

  const filtered = findings.filter((f) =>
    filterSeverity === "all" || f.severity === filterSeverity
  );

  const critCount = findings.filter((f) => f.severity === "critical").length;
  const warnCount = findings.filter((f) => f.severity === "warning").length;
  const advCount = findings.filter((f) => f.severity === "advisory").length;
  const pendingCount = findings.filter((f) => f.review_decision === "pending").length;
  const confirmedCount = findings.filter((f) => f.review_decision === "confirmed_violation").length;

  if (isLoading) {
    return (
      <div className="packcheck-workspace-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-slate-500 mt-3">Loading compliance findings...</p>
      </div>
    );
  }

  return (
    <div className="packcheck-workspace">
      <header className="packcheck-workspace-header">
        <div className="packcheck-workspace-nav">
          <Link href="/dashboard" className="packcheck-back-btn">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <Link href={`/inspection/${id}/overview`} className="text-slate-500 hover:text-slate-700 text-sm">Overview</Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-700 font-medium text-sm">Compliance Review</span>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <div className="packcheck-save-toast">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{saveMsg}</span>
            </div>
          )}
          <button onClick={handleReanalysis} disabled={isReanalysing} className="packcheck-icon-btn" title="Re-run compliance analysis">
            <RefreshCw className={`h-4 w-4 ${isReanalysing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <WorkspaceTabs inspectionId={id} activeTab="compliance" />

      <div className="packcheck-workspace-content">
        {/* DISCLAIMER */}
        <div className="packcheck-compliance-disclaimer">
          <Scale className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-slate-800">Legal Metrology (Packaged Commodities) Rules, 2011 — Compliance Analysis</p>
            <p className="text-sm text-slate-500 mt-1">
              AI has evaluated extracted declarations against applicable PCR 2011 rules. All findings are <span className="font-medium text-amber-600">advisory only</span> — an authorized Legal Metrology Officer must review and confirm each finding before any enforcement action. AI cannot determine physical compliance (weight, font size, placement).
            </p>
          </div>
        </div>

        {/* SUMMARY STRIP */}
        <div className="packcheck-compliance-summary">
          <div className="packcheck-csumm-item">
            <AlertOctagon className="h-4 w-4 text-red-500" />
            <span className="font-bold text-red-600 text-lg">{critCount}</span>
            <span className="text-slate-500 text-sm">Critical</span>
          </div>
          <div className="packcheck-csumm-divider" />
          <div className="packcheck-csumm-item">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-amber-600 text-lg">{warnCount}</span>
            <span className="text-slate-500 text-sm">Warnings</span>
          </div>
          <div className="packcheck-csumm-divider" />
          <div className="packcheck-csumm-item">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="font-bold text-blue-600 text-lg">{advCount}</span>
            <span className="text-slate-500 text-sm">Advisory</span>
          </div>
          <div className="packcheck-csumm-divider" />
          <div className="packcheck-csumm-item">
            <Eye className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-amber-600 text-lg">{pendingCount}</span>
            <span className="text-slate-500 text-sm">Pending Review</span>
          </div>
          <div className="packcheck-csumm-divider" />
          <div className="packcheck-csumm-item">
            <Check className="h-4 w-4 text-red-600" />
            <span className="font-bold text-red-600 text-lg">{confirmedCount}</span>
            <span className="text-slate-500 text-sm">Confirmed Violations</span>
          </div>
        </div>

        {/* SEVERITY FILTER */}
        <div className="packcheck-filter-tabs">
          {["all", "critical", "warning", "advisory"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`packcheck-filter-tab ${filterSeverity === sev ? "active" : ""}`}
            >
              {sev === "all" ? "All Findings" : <><span className="capitalize">{sev}</span>
                <span className="ml-1 text-xs">
                  ({sev === "critical" ? critCount : sev === "warning" ? warnCount : advCount})
                </span>
              </>}
            </button>
          ))}
        </div>

        {/* FINDINGS LIST */}
        {filtered.length === 0 ? (
          <div className="packcheck-empty">
            <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No findings at this severity level</p>
            <p className="text-slate-400 text-sm">
              {findings.length === 0
                ? "Run compliance analysis first by uploading images and processing the inspection."
                : "No findings match the current filter."}
            </p>
          </div>
        ) : (
          <div className="packcheck-findings-detail-list">
            {filtered.map((finding) => {
              const sev = SEVERITY_CONFIG[finding.severity] ?? SEVERITY_CONFIG.advisory;
              const SevIcon = sev.icon;
              const decision = DECISION_CONFIG[finding.review_decision as keyof typeof DECISION_CONFIG] ?? DECISION_CONFIG.pending;
              const isExpanded = expandedId === finding.id;
              const currentNote = noteValue[finding.id] ?? finding.investigator_notes ?? "";

              return (
                <div
                  key={finding.id}
                  className={`packcheck-finding-detail ${sev.border} ${isExpanded ? "packcheck-finding-expanded" : ""}`}
                >
                  {/* FINDING HEADER */}
                  <div
                    className="packcheck-finding-detail-header"
                    onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                  >
                    <div className={`packcheck-finding-sev-icon ${sev.bg} ${sev.color}`}>
                      <SevIcon className="h-4 w-4" />
                    </div>
                    <div className="packcheck-finding-detail-info">
                      <div className="packcheck-finding-detail-title">
                        <span className="font-mono text-xs text-slate-400">{finding.finding_number}</span>
                        <span className="packcheck-finding-title-text">{finding.title}</span>
                        <span className={`packcheck-badge ${sev.badge}`}>{sev.label}</span>
                      </div>
                      <div className="packcheck-finding-category text-sm text-slate-500">{finding.category}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className={`packcheck-badge ${decision.color}`}>{decision.label}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* EXPANDED DETAIL */}
                  {isExpanded && (
                    <div className="packcheck-finding-detail-body">
                      <div className="packcheck-finding-detail-grid">
                        <div className="packcheck-finding-detail-row">
                          <div className="packcheck-finding-detail-label">Observed Value</div>
                          <div className="packcheck-finding-detail-value">
                            {finding.observed_value ?? <span className="text-slate-400 italic">Not detected</span>}
                          </div>
                        </div>
                        <div className="packcheck-finding-detail-row">
                          <div className="packcheck-finding-detail-label">Rule Requirement</div>
                          <div className="packcheck-finding-detail-value">{finding.expected_requirement}</div>
                        </div>
                        <div className="packcheck-finding-detail-row">
                          <div className="packcheck-finding-detail-label">AI Explanation</div>
                          <div className="packcheck-finding-detail-value">{finding.explanation}</div>
                        </div>
                        <div className="packcheck-finding-detail-row">
                          <div className="packcheck-finding-detail-label">Applicable Rule</div>
                          <div className="packcheck-finding-detail-value">
                            <span className="font-mono text-sm">{finding.rule_id}</span>
                            <span className="text-slate-500 text-xs ml-2">{finding.ruleset_version}</span>
                          </div>
                        </div>
                        {finding.ai_confidence_score && (
                          <div className="packcheck-finding-detail-row">
                            <div className="packcheck-finding-detail-label">Engine Confidence</div>
                            <div className="packcheck-finding-detail-value">
                              <div className="packcheck-confidence-bar" style={{ width: "160px" }}>
                                <div className="packcheck-confidence-fill packcheck-conf-high" style={{ width: `${finding.ai_confidence_score}%` }} />
                              </div>
                              <span className="text-sm text-slate-500 ml-2">{Math.round(finding.ai_confidence_score)}%</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* INVESTIGATOR NOTE */}
                      <div className="packcheck-investigator-note">
                        <label className="packcheck-label">
                          <MessageSquare className="h-4 w-4" />
                          Investigator Note
                        </label>
                        <textarea
                          value={currentNote}
                          onChange={(e) => setNoteValue((prev) => ({ ...prev, [finding.id]: e.target.value }))}
                          placeholder="Add your findings, observations, or reasons for decision..."
                          className="packcheck-input packcheck-textarea"
                          rows={3}
                        />
                      </div>

                      {/* REVIEW ACTIONS */}
                      <div className="packcheck-review-actions">
                        <p className="text-sm font-medium text-slate-600 mb-3">Review Decision</p>
                        <div className="packcheck-review-buttons">
                          <button
                            onClick={() => updateDecision(finding, "confirmed_violation", currentNote)}
                            disabled={savingId === finding.id}
                            className={`packcheck-review-btn packcheck-review-btn-confirm ${finding.review_decision === "confirmed_violation" ? "packcheck-review-btn-active-red" : ""}`}
                          >
                            {savingId === finding.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}
                            Confirm Violation
                          </button>
                          <button
                            onClick={() => updateDecision(finding, "needs_further_inspection", currentNote)}
                            disabled={savingId === finding.id}
                            className={`packcheck-review-btn packcheck-review-btn-inspect ${finding.review_decision === "needs_further_inspection" ? "packcheck-review-btn-active-blue" : ""}`}
                          >
                            <Eye className="h-4 w-4" />
                            Needs Further Inspection
                          </button>
                          <button
                            onClick={() => updateDecision(finding, "accepted_compliant", currentNote)}
                            disabled={savingId === finding.id}
                            className={`packcheck-review-btn packcheck-review-btn-accept ${finding.review_decision === "accepted_compliant" ? "packcheck-review-btn-active-green" : ""}`}
                          >
                            <Check className="h-4 w-4" />
                            Accept as Compliant
                          </button>
                          <button
                            onClick={() => updateDecision(finding, "dismissed", currentNote)}
                            disabled={savingId === finding.id}
                            className={`packcheck-review-btn packcheck-review-btn-dismiss ${finding.review_decision === "dismissed" ? "packcheck-review-btn-active-slate" : ""}`}
                          >
                            <X className="h-4 w-4" />
                            Dismiss
                          </button>
                        </div>
                      </div>

                      {finding.reviewed_at && (
                        <p className="text-xs text-slate-400 mt-2">
                          Last reviewed: {new Date(finding.reviewed_at).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PROCEED TO REPORT */}
        {findings.length > 0 && (
          <div className="packcheck-compliance-footer">
            <div className="packcheck-compliance-footer-info">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-slate-600">
                {pendingCount > 0
                  ? `${pendingCount} finding${pendingCount !== 1 ? "s" : ""} still pending review. Review all findings before generating the final report.`
                  : "All findings reviewed. You can now generate the final inspection report."}
              </span>
            </div>
            <Link href={`/inspection/${id}/report`} className="packcheck-btn-primary">
              <FileText className="h-4 w-4" />
              Generate Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
