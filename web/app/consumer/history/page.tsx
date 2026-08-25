"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ChevronLeft,
  ScanSearch,
  FileCheck2,
  Loader2,
} from "lucide-react";

interface HistoryCheck {
  id: string;
  case_number: string;
  product_name: string;
  brand: string;
  category: string;
  status: string;
  created_at: string;
  overall_confidence_score?: number;
  is_flagged?: boolean;
  flag_status?: string;
  inspection_images?: { public_url: string }[];
}

export default function ConsumerHistoryPage() {
  const [history, setHistory] = useState<HistoryCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inspections")
          .select("id, case_number, product_name, brand, category, status, created_at, overall_confidence_score, is_flagged, flag_status, inspection_images(public_url)")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setHistory(data as unknown as HistoryCheck[]);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* =========================================================
          HEADER
      ========================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <Link
            href="/consumer"
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900">PackCheck</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/consumer"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
          >
            <ScanSearch className="h-3.5 w-3.5" />
            <span>Check a Product</span>
          </Link>
        </div>
      </header>

      {/* =========================================================
          CONTENT
      ========================================================== */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-emerald-600" />
            <span>Product Check History</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review previous packaged commodity checks and Legal Metrology assessments
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 rounded-3xl border border-slate-200 bg-white text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading check history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">No product checks yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              Upload a product to perform your first Legal Metrology compliance check.
            </p>
            <Link
              href="/consumer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <span>Check a Product</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.map((item) => {
              const isCompliant = item.status === "cleared" || item.status === "verified";
              const isAttention = item.status === "review_required" || item.status === "processing";

              return (
                <Link
                  key={item.id}
                  href={`/consumer/check/${item.id}`}
                  className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-emerald-500/60 hover:shadow-md transition shadow-2xs space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {item.case_number}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.is_flagged && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          Reported
                        </span>
                      )}
                      {isCompliant ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Looks Compliant
                        </span>
                      ) : isAttention ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Attention Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertOctagon className="h-3 w-3 text-rose-600" />
                          Potential Issue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.inspection_images?.[0]?.public_url && (
                      <div className="h-12 w-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.inspection_images[0].public_url}
                          alt="thumbnail"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                        {item.product_name || "Packaged Product"}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {item.brand} • {item.category}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-100">
                    <span>
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    <span className="text-emerald-700 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View report <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
