"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  UserRound,
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Upload,
  RefreshCw,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Building2,
  ExternalLink,
  Check,
} from "lucide-react";
import { DEMO_TEST_PACKAGES } from "@/lib/data";

export default function ConsumerCheckPage() {
  const [selectedSample, setSelectedSample] = useState(DEMO_TEST_PACKAGES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(true);
  const [userUploaded, setUserUploaded] = useState(false);

  const handleScanSample = (sample: typeof DEMO_TEST_PACKAGES[0]) => {
    setSelectedSample(sample);
    setUserUploaded(false);
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 600);
  };

  const handleSimulateUpload = () => {
    setUserUploaded(true);
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* NAVBAR (LIGHT THEME) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-sm text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">PackCheck</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 border border-emerald-300">
                CITIZEN PORTAL
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Public Legal Metrology Commodity Verifier</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/investigator"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Investigator Workspace</span>
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-3 py-1.5 rounded-xl border border-slate-300 bg-white shadow-xs"
          >
            Sign Out
          </Link>
        </div>
      </header>

      {/* HERO / INTRO */}
      <section className="px-4 lg:px-8 py-8 max-w-5xl w-full mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-900 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          Know Your Rights Under Legal Metrology (Packaged Commodities) Rules 2011
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Verify What&apos;s On The Label Before You Buy
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          Every packaged commodity in India must carry mandatory declarations including MRP (with all taxes), Net Quantity, Expiry/Mfg date, and Consumer Care contacts.
        </p>
      </section>

      {/* MAIN CHECKER WORKBENCH */}
      <main className="flex-1 px-4 lg:px-8 pb-12 max-w-5xl w-full mx-auto space-y-8">
        {/* PACKAGE SELECTOR / UPLOAD BAR */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ScanSearch className="h-4 w-4 text-emerald-600" />
              1. Choose a test commodity or upload photo
            </h2>
            <span className="text-[11px] text-slate-500 font-bold">Live AI OCR Evaluation</span>
          </div>

          {/* Quick Demo Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO_TEST_PACKAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleScanSample(sample)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
                  selectedSample.id === sample.id && !userUploaded
                    ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/30"
                    : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/60"
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                  {sample.category}
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-2">{sample.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{sample.brand}</p>
                <div className="mt-2 text-[10px] text-slate-600 font-medium flex items-center gap-1">
                  <span>MRP {sample.simulatedMRP}</span> • <span>{sample.simulatedNetQty.split(" ")[0]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Upload Box */}
          <div
            onClick={handleSimulateUpload}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/70 transition text-center cursor-pointer flex items-center justify-center gap-3"
          >
            <Upload className="h-5 w-5 text-emerald-600" />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Upload Your Own Package Label Photo</p>
              <p className="text-[10px] text-slate-500 font-medium">Click to upload label from camera or album (JPG, PNG)</p>
            </div>
          </div>
        </div>

        {/* SCANNING PROGRESS OR RESULTS */}
        {isScanning ? (
          <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-4 shadow-sm">
            <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Scanning Label Declarations...</h3>
            <p className="text-xs text-slate-500 font-medium">Extracting MRP, Net Quantity, Expiry dates &amp; Checking Consumer Safety Rules</p>
          </div>
        ) : hasScanned ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* PRODUCT SUMMARY & COMPLIANCE HEALTH */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    SCAN RESULT
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1.5">{selectedSample.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Brand: {selectedSample.brand} • Category: {selectedSample.category}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    {selectedSample.sampleIssues.length} Noticeable Item(s)
                  </span>
                </div>
              </div>

              {/* 4 Citizen Checks Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <CheckPill
                  title="Maximum Retail Price"
                  value={selectedSample.simulatedMRP}
                  status="Valid"
                  isGood={true}
                />
                <CheckPill
                  title="Net Quantity"
                  value={selectedSample.simulatedNetQty}
                  status="Requires Attention"
                  isGood={false}
                />
                <CheckPill
                  title="Packaging Date"
                  value={selectedSample.simulatedMfg}
                  status="Valid"
                  isGood={true}
                />
                <CheckPill
                  title="Consumer Helpline"
                  value="Helpline Info"
                  status={selectedSample.id === "demo-almonds" ? "Missing Phone" : "Valid"}
                  isGood={selectedSample.id !== "demo-almonds"}
                />
              </div>
            </div>

            {/* WHAT THIS MEANS FOR YOU */}
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Info className="h-4 w-4 text-amber-600" />
                <span>What you should know about this package:</span>
              </div>

              <div className="space-y-2">
                {selectedSample.sampleIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-white border border-amber-200/80 text-xs text-slate-700 font-medium flex items-start gap-2.5 shadow-2xs">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-800 font-bold">Consumer Tip: </strong>
                  <span>{selectedSample.consumerAdvice}</span>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <p className="text-xs text-slate-600 font-medium">
                Suspect unfair packaging or missing declarations? You can report to the National Consumer Helpline (1915).
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Report docket initiated. Thank you for being a vigilant consumer!")}
                  className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  Flag This Product
                </button>
                <Link
                  href="/"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function CheckPill({
  title,
  value,
  status,
  isGood,
}: {
  title: string;
  value: string;
  status: string;
  isGood: boolean;
}) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-1">
      <span className="text-[10px] text-slate-500 font-semibold block">{title}</span>
      <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
          isGood ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {isGood ? <Check className="h-3 w-3 text-emerald-600" /> : <AlertTriangle className="h-3 w-3 text-amber-600" />}
        {status}
      </span>
    </div>
  );
}
