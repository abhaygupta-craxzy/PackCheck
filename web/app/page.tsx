"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  ScanLine,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";


/* =========================================================
   NAVBAR
   ========================================================= */

function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <header className={`packcheck-navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="packcheck-navbar-inner">

        {/* BRAND */}
        <a href="#top" className="packcheck-brand">

          <div className="packcheck-brand-mark">
            <ShieldCheck
              size={22}
              strokeWidth={2.3}
            />
          </div>

          <div className="packcheck-brand-text">
            <span className="packcheck-brand-name">
              PackCheck
            </span>

            <span className="packcheck-brand-caption">
              Legal Metrology Intelligence
            </span>
          </div>

        </a>


        {/* CENTER NAV */}
        <nav className="packcheck-nav-menu">

          <a
            href="#workflow"
            className="packcheck-nav-item active"
          >
            <span>Workflow</span>
          </a>

          <a
            href="#entry-points"
            className="packcheck-nav-item"
          >
            <span>For users</span>
          </a>

          <a
            href="#evidence"
            className="packcheck-nav-item"
          >
            <span>Evidence</span>
          </a>

        </nav>


        {/* RIGHT ACTIONS */}
        <div className="packcheck-nav-actions">

          <Link
            href="/login"
            className="packcheck-signin"
          >
            Sign in
          </Link>

          <Link
            href="/login?role=investigator"
            className="packcheck-inspection-button"
          >
            <span>
              Start inspection
            </span>

            <span className="packcheck-inspection-arrow">
              <ArrowRight size={15} />
            </span>
          </Link>

        </div>

      </div>
    </header>
  );
}

/* =========================================================
   HERO
   ========================================================= */

function Hero() {
  return (
    <section
      id="top"
      className="pc-hero"
    >

      {/* BACKGROUND DETAILS */}
      <div className="pc-hero-grid" />

      <div className="pc-hero-glow pc-glow-blue" />
      <div className="pc-hero-glow pc-glow-teal" />


      <div className="pc-container pc-hero-inner">

        {/* LEFT */}
        <div className="pc-hero-copy">

          <div className="pc-eyebrow">

            <span className="pc-eyebrow-icon">
              <Sparkles size={14} />
            </span>

            AI-assisted compliance inspection

          </div>


          <h1 className="pc-hero-title">

            Legal Metrology
            <br />

            <span className="pc-blue-text">
              inspection
            </span>

            {" "}made
            <br />

            intelligent.

          </h1>


          <p className="pc-hero-description">
            Analyze packaged commodity declarations,
            evaluate applicable requirements, and review
            supporting evidence through one structured
            inspection workflow.
          </p>


          {/* ACTIONS */}
          <div className="pc-hero-actions">

            <Link
              href="/login?role=investigator"
              className="pc-button-primary"
            >
              <span>
                Start an inspection
              </span>

              <span className="pc-button-icon">
                <ArrowRight size={17} />
              </span>
            </Link>


            <Link
              href="/login?role=consumer"
              className="pc-button-secondary"
            >
              <ScanLine size={16} />
              Check a package
            </Link>

          </div>


          {/* TRUST ROW */}
          <div className="pc-trust-row">

            <div className="pc-trust-item">
              <Check size={14} />
              OCR & declaration extraction
            </div>

            <div className="pc-trust-item">
              <Check size={14} />
              Rules-based evaluation
            </div>

            <div className="pc-trust-item">
              <Check size={14} />
              Human review
            </div>

          </div>

        </div>


        {/* RIGHT ANALYSIS CARD */}
        <div className="pc-analysis-stage">

          <div className="pc-stage-orbit pc-orbit-one" />
          <div className="pc-stage-orbit pc-orbit-two" />


          <div className="pc-analysis-card">

            {/* CARD HEADER */}
            <div className="pc-analysis-header">

              <div className="pc-analysis-title-group">

                <div className="pc-analysis-icon">
                  <ClipboardCheck size={18} />
                </div>

                <div>
                  <span className="pc-small-label">
                    ACTIVE INSPECTION
                  </span>

                  <h3>
                    Package Analysis
                  </h3>
                </div>

              </div>


              <div className="pc-complete-pill">
                <CheckCircle2 size={14} />
                Analysis complete
              </div>

            </div>


            {/* CARD BODY */}
            <div className="pc-analysis-body">

              {/* IMAGE */}
              <div className="pc-package-panel">

                <div className="pc-panel-topline">

                  <span>
                    PACKAGE EVIDENCE
                  </span>

                  <span>
                    FRONT VIEW
                  </span>

                </div>


                <div className="pc-package-preview">

                  <div className="pc-ocr-badge">
                    <ScanLine size={13} />
                    OCR 96%
                  </div>


                  <div className="pc-package">

                    <div className="pc-package-blue-line" />

                    <div className="pc-package-title-line" />

                    <div className="pc-package-product">
                      <div className="pc-product-dot" />
                    </div>

                    <div className="pc-package-text pc-text-one" />
                    <div className="pc-package-text pc-text-two" />

                    <div className="pc-package-mrp">
                      MRP ₹120
                    </div>

                  </div>


                  <div className="pc-evidence-box pc-evidence-mrp">
                    MRP ₹120
                  </div>

                  <div className="pc-evidence-box pc-evidence-product">
                    Detected
                  </div>

                  <div className="pc-image-verified">
                    <Check size={12} />
                    Image verified
                  </div>

                </div>


                <div className="pc-image-footer">

                  <span>
                    2 evidence regions
                  </span>

                  <span>
                    Package front
                  </span>

                </div>

              </div>


              {/* DECLARATIONS */}
              <div className="pc-declarations-panel">

                <div className="pc-declaration-heading">

                  <div>
                    <h4>
                      Extracted declarations
                    </h4>

                    <p>
                      AI extraction · review before evaluation
                    </p>
                  </div>

                  <div className="pc-corner-icon">
                    <ScanLine size={16} />
                  </div>

                </div>


                <Declaration
                  label="Maximum Retail Price"
                  value="₹120"
                  confidence="98%"
                />

                <Declaration
                  label="Net Quantity"
                  value="500 g"
                  confidence="96%"
                />

                <Declaration
                  label="Manufacturer"
                  value="ABC Foods Pvt. Ltd."
                  confidence="94%"
                />

                <Declaration
                  label="Country of Origin"
                  value="India"
                  confidence="99%"
                />


                {/* CONFIDENCE */}
                <div className="pc-confidence">

                  <div className="pc-confidence-top">

                    <span>
                      Extraction confidence
                    </span>

                    <strong>
                      96%
                    </strong>

                  </div>

                  <div className="pc-progress">
                    <div
                      className="pc-progress-fill"
                      style={{ width: "96%" }}
                    />
                  </div>

                </div>


                {/* METRICS */}
                <div className="pc-mini-stats">

                  <MiniStat
                    value="12"
                    label="Declarations"
                    type="blue"
                  />

                  <MiniStat
                    value="18"
                    label="Rules checked"
                    type="teal"
                  />

                  <MiniStat
                    value="03"
                    label="Needs review"
                    type="amber"
                  />

                </div>

              </div>

            </div>


            {/* PROCESS BAR */}
            <div className="pc-analysis-footer">

              <ProcessStatus
                icon={<ScanLine size={14} />}
                title="AI extraction"
                value="Complete"
                type="blue"
              />

              <ProcessStatus
                icon={<Zap size={14} />}
                title="Rules engine"
                value="18 checks"
                type="teal"
              />

              <ProcessStatus
                icon={<UserCheck size={14} />}
                title="Human review"
                value="2 findings"
                type="amber"
              />

            </div>

          </div>


          {/* FLOATING STATUS */}
          <div className="pc-floating-status pc-status-one">
            <span className="pc-status-dot blue" />
            OCR confidence 96%
          </div>

          <div className="pc-floating-status pc-status-two">
            <span className="pc-status-dot green" />
            Evidence linked
          </div>

        </div>

      </div>


      {/* HERO BOTTOM BAR */}
      <div className="pc-hero-bottom">

        <div className="pc-container pc-hero-bottom-inner">

          <span>
            LEGAL METROLOGY COMPLIANCE & INSPECTION PLATFORM
          </span>

          <div className="pc-bottom-line" />

          <span>
            Prototype · 2026
          </span>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   DECLARATION
   ========================================================= */

function Declaration({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string;
  confidence: string;
}) {
  return (
    <div className="pc-declaration">

      <div className="pc-declaration-left">

        <span>
          {label}
        </span>

        <small>
          OCR confidence {confidence}
        </small>

      </div>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   MINI STAT
   ========================================================= */

function MiniStat({
  value,
  label,
  type,
}: {
  value: string;
  label: string;
  type: "blue" | "teal" | "amber";
}) {
  return (
    <div className={`pc-mini-stat ${type}`}>

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}


/* =========================================================
   PROCESS STATUS
   ========================================================= */

function ProcessStatus({
  icon,
  title,
  value,
  type,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  type: "blue" | "teal" | "amber";
}) {
  return (
    <div className="pc-process-status">

      <div className={`pc-process-icon ${type}`}>
        {icon}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <span>
          {value}
        </span>

      </div>

    </div>
  );
}


/* =========================================================
   WORKFLOW
   ========================================================= */

function WorkflowSection() {

  const steps = [
    {
      number: "01",
      title: "Capture",
      description:
        "Upload package images or relevant listing evidence.",
      footer: "Evidence intake",
      icon: <FileSearch size={20} />,
      type: "blue",
    },
    {
      number: "02",
      title: "Extract",
      description:
        "Identify mandatory declarations using OCR and computer vision.",
      footer: "AI-assisted extraction",
      icon: <Sparkles size={20} />,
      type: "purple",
    },
    {
      number: "03",
      title: "Evaluate",
      description:
        "Apply applicable Legal Metrology requirements through the rules engine.",
      footer: "Deterministic evaluation",
      icon: <Zap size={20} />,
      type: "teal",
    },
    {
      number: "04",
      title: "Review",
      description:
        "Verify findings, inspect evidence, and prepare the inspection report.",
      footer: "Human decision",
      icon: <FileCheck2 size={20} />,
      type: "amber",
    },
  ];

  return (
    <section
      id="workflow"
      className="pc-workflow"
    >

      <div className="pc-container">

        <div className="pc-section-intro">

          <div className="pc-section-kicker">
            <span />
            INSPECTION WORKFLOW
          </div>

          <h2>
            From package evidence to{" "}
            <span>
              review-ready findings.
            </span>
          </h2>

          <p>
            PackCheck combines AI-assisted extraction with
            deterministic evaluation while keeping the
            investigator responsible for the final decision.
          </p>

        </div>


        <div className="pc-workflow-track">

          {steps.map((step, index) => (

            <React.Fragment key={step.number}>

              <div className={`pc-work-card ${step.type}`}>

                <div className="pc-work-top">

                  <div className={`pc-work-icon ${step.type}`}>
                    {step.icon}
                  </div>

                  <span className="pc-work-number">
                    {step.number}
                  </span>

                </div>


                <div className="pc-work-content">

                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.description}
                  </p>

                </div>


                <div className="pc-work-footer">

                  <CheckCircle2 size={15} />

                  <span>
                    {step.footer}
                  </span>

                  <ArrowRight
                    size={15}
                    className="pc-work-arrow"
                  />

                </div>

              </div>


              {index < steps.length - 1 && (
                <div className="pc-work-connector">
                  <ChevronRight size={18} />
                </div>
              )}

            </React.Fragment>

          ))}

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   ENTRY POINTS
   ========================================================= */

function EntryPointsSection() {
  return (
    <section
      id="entry-points"
      className="pc-entry"
    >

      <div className="pc-container">

        <div className="pc-entry-heading">

          <div className="pc-section-kicker dark">
            <span />
            TWO WAYS TO USE PACKCHECK
          </div>

          <h2>
            Built for{" "}
            <span>investigators</span>
            {" "}and consumers.
          </h2>

          <p>
            One compliance intelligence platform with
            purpose-built experiences for authorized
            inspection workflows and public package checks.
          </p>

        </div>


        <div className="pc-entry-grid">

          {/* INVESTIGATOR */}
          <div className="pc-entry-card investigator">

            <div className="pc-entry-card-top">

              <div className="pc-entry-icon">
                <Shield size={21} />
              </div>

              <span className="pc-entry-label">
                AUTHORIZED WORKFLOW
              </span>

            </div>


            <div className="pc-entry-main">

              <h3>
                Investigator workspace
              </h3>

              <p>
                Run structured inspections, evaluate
                declarations against applicable requirements,
                review evidence, record decisions, and
                prepare inspection reports.
              </p>

            </div>


            <div className="pc-entry-bottom">

              <div className="pc-entry-status">
                <ShieldCheck size={15} />
                Authorized inspection
              </div>

              <Link
                href="/login?role=investigator"
                className="pc-entry-button white"
              >
                Open workspace
                <ArrowRight size={16} />
              </Link>

            </div>

          </div>


          {/* CONSUMER */}
          <div className="pc-entry-card consumer">

            <div className="pc-entry-card-top">

              <div className="pc-entry-icon">
                <BadgeCheck size={21} />
              </div>

              <span className="pc-entry-label">
                PUBLIC INFORMATIONAL CHECK
              </span>

            </div>


            <div className="pc-entry-main">

              <h3>
                Consumer package check
              </h3>

              <p>
                Upload a product image to check visible
                packaged commodity declarations and understand
                potential issues before making a purchase.
              </p>

            </div>


            <div className="pc-entry-bottom">

              <div className="pc-entry-status">
                <CheckCircle2 size={15} />
                Public package check
              </div>

              <Link
                href="/login?role=consumer"
                className="pc-entry-button dark"
              >
                Check a package
                <ArrowRight size={16} />
              </Link>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   EVIDENCE
   ========================================================= */

function EvidenceSection() {
  return (
    <section
      id="evidence"
      className="pc-evidence"
    >

      <div className="pc-container pc-evidence-grid">

        {/* LEFT */}
        <div className="pc-evidence-copy">

          <div className="pc-section-kicker dark">
            <span />
            EVIDENCE-FIRST INSPECTION
          </div>

          <h2>
            Every potential finding
            has an{" "}
            <span>
              evidence trail.
            </span>
          </h2>

          <p>
            Extracted declarations, applicable requirements,
            package regions, and investigator decisions stay
            connected so that the final finding remains
            reviewable.
          </p>


          <div className="pc-evidence-list">

            <EvidenceItem
              icon={<ScanLine size={18} />}
              title="Extraction evidence"
              description="See the declaration and package region from which it was extracted."
              type="blue"
            />

            <EvidenceItem
              icon={<ClipboardCheck size={18} />}
              title="Rule reference"
              description="Show the applicable compliance requirement used for evaluation."
              type="purple"
            />

            <EvidenceItem
              icon={<UserCheck size={18} />}
              title="Human decision"
              description="Keep the investigator in control of the final finding and report."
              type="teal"
            />

          </div>

        </div>


        {/* RIGHT FINDING CARD */}
        <div className="pc-finding">

          <div className="pc-finding-header">

            <div>

              <span>
                SAMPLE FINDING
              </span>

              <h3>
                Consumer care declaration
              </h3>

            </div>

            <div className="pc-review-pill">
              Needs review
            </div>

          </div>


          <div className="pc-finding-body">

            <div className="pc-finding-image">

              <div className="pc-mini-package">

                <div className="pc-mini-package-blue" />

                <div className="pc-mini-product">
                  <div />
                </div>

                <div className="pc-mini-lines" />

                <div className="pc-mini-lines short" />

                <div className="pc-mini-mrp">
                  MRP ₹120
                </div>

              </div>

            </div>


            <div className="pc-finding-details">

              <FindingRow
                label="Declaration"
                value="Consumer care information"
              />

              <FindingRow
                label="Rule evaluation"
                value="Requires review"
                warning
              />

              <FindingRow
                label="Evidence"
                value="Package front"
                blue
              />


              <div className="pc-action-box">

                <div className="pc-action-icon">
                  <UserCheck size={17} />
                </div>

                <div>

                  <strong>
                    Investigator action required
                  </strong>

                  <p>
                    Verify the declaration against the
                    highlighted package region before
                    recording the final finding.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   EVIDENCE ITEM
   ========================================================= */

function EvidenceItem({
  icon,
  title,
  description,
  type,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: "blue" | "purple" | "teal";
}) {
  return (
    <div className="pc-evidence-item">

      <div className={`pc-evidence-item-icon ${type}`}>
        {icon}
      </div>

      <div>

        <h4>
          {title}
        </h4>

        <p>
          {description}
        </p>

      </div>

      <ArrowRight
        size={16}
        className="pc-evidence-item-arrow"
      />

    </div>
  );
}


/* =========================================================
   FINDING ROW
   ========================================================= */

function FindingRow({
  label,
  value,
  warning = false,
  blue = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
  blue?: boolean;
}) {
  return (
    <div className="pc-finding-row">

      <span>
        {label}
      </span>

      <strong
        className={
          warning
            ? "warning"
            : blue
            ? "blue"
            : ""
        }
      >
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   CTA
   ========================================================= */

function CTASection() {
  return (
    <section className="pc-cta-section">

      <div className="pc-container">

        <div className="pc-cta">

          <div className="pc-cta-grid" />

          <div className="pc-cta-circle pc-cta-circle-one" />
          <div className="pc-cta-circle pc-cta-circle-two" />


          <div className="pc-cta-content">

            <div className="pc-cta-kicker">
              <ShieldCheck size={14} />
              PACKCHECK
            </div>

            <h2>
              Turn package evidence into
              <span>
                actionable compliance intelligence.
              </span>
            </h2>

            <p>
              Upload evidence, extract declarations,
              evaluate applicable requirements, and keep
              the investigator in control.
            </p>


            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/login?role=investigator"
                className="pc-cta-button"
              >
                <span>
                  Start a structured inspection
                </span>

                <span className="pc-cta-button-icon">
                  <ArrowRight size={17} />
                </span>
              </Link>

              <Link
                href="/login?role=consumer"
                className="inline-flex items-center justify-center gap-2 h-[51px] px-6 rounded-[14px] border border-white/30 bg-white/15 hover:bg-white/25 text-white font-bold text-[13px] shadow-sm backdrop-blur-xs transition-transform duration-200 hover:-translate-y-0.5"
              >
                <ScanLine size={17} />
                <span>Check a package as Citizen</span>
              </Link>
            </div>

          </div>


          <div className="pc-cta-side">

            <div className="pc-cta-side-card">

              <div className="pc-cta-side-icon">
                <ClipboardCheck size={20} />
              </div>

              <div>

                <strong>
                  Inspection ready
                </strong>

                <span>
                  Evidence · Rules · Review
                </span>

              </div>

              <CheckCircle2
                size={18}
                className="pc-cta-check"
              />

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   FOOTER
   ========================================================= */

function Footer() {
  return (
    <footer className="pc-footer">

      <div className="pc-container pc-footer-inner">

        <div className="pc-footer-brand">

          <div className="pc-footer-mark">
            <ShieldCheck size={18} />
          </div>

          <div>

            <strong>
              PackCheck
            </strong>

            <span>
              Legal Metrology Compliance & Inspection Platform
            </span>

          </div>

        </div>


        <div className="pc-footer-meta">

          <span>
            Prototype · 2026
          </span>

          <span className="pc-footer-divider" />

          <span>
            Compliance Intelligence
          </span>

        </div>

      </div>

    </footer>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

export default function Home() {

  const [scrolled, setScrolled] =
    useState(false);


  useEffect(() => {

    const handleScroll = () => {
      setScrolled(window.scrollY > 45);
    };


    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );


    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);


  return (
    <main className="pc-page">

      <Navbar scrolled={scrolled} />

      <Hero />

      <WorkflowSection />

      <EntryPointsSection />

      <EvidenceSection />

      <CTASection />

      <Footer />

    </main>
  );
}