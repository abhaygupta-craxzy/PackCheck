"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createInspection,
  uploadInspectionImage,
  processImageOCR,
  runComplianceAnalysis,
} from "@/lib/actions/inspection";
import {
  ShieldCheck,
  ScanSearch,
  Upload,
  Camera,
  Image as ImageIcon,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Clock,
  Trash2,
  RefreshCw,
  Loader2,
  FileCheck2,
  Layers,
  ChevronRight,
  User,
  Info,
  Check,
  X,
} from "lucide-react";

interface UploadedImageItem {
  id: string;
  file?: File;
  base64: string;
  name: string;
  mimeType: string;
  imageType: string; // 'front' | 'back' | 'mrp_area' | 'ecommerce'
}

interface RecentCheck {
  id: string;
  case_number: string;
  product_name: string;
  brand: string;
  category: string;
  status: string;
  created_at: string;
  overall_confidence_score?: number;
  thumbnail_url?: string;
  issues_count?: number;
}

export default function ConsumerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"check" | "recent">("check");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Packaged Food");
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [selectedImageType, setSelectedImageType] = useState<string>("front");

  // Analysis Pipeline States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Recent History
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Help Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Pipeline animation steps
  const analysisSteps = [
    "Reading package information",
    "Detecting text and declarations",
    "Identifying product information",
    "Extracting mandatory declarations",
    "Checking Legal Metrology requirements",
    "Preparing results",
  ];

  // Load Recent Checks from Supabase
  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoadingHistory(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from("inspections")
          .select("id, case_number, product_name, brand, category, status, created_at, overall_confidence_score")
          .order("created_at", { ascending: false })
          .limit(8);

        if (!error && data) {
          setRecentChecks(data as RecentCheck[]);
        }
      } catch (err) {
        console.warn("Notice loading history:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, customType?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setImages((prev) => [
            ...prev,
            {
              id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              base64,
              name: file.name,
              mimeType: file.type || "image/jpeg",
              imageType: customType || selectedImageType,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value
    if (e.target) e.target.value = "";
  };

  // Quick Demo Preload for instant evaluation
  const handleLoadSample = (sampleName: string, sampleBrand: string, sampleCategory: string, sampleUrl: string) => {
    setProductName(sampleName);
    setBrand(sampleBrand);
    setCategory(sampleCategory);

    // Create simulated package evidence
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw simulated package
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, 600, 800);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(sampleBrand, 50, 100);

      ctx.fillStyle = "#334155";
      ctx.font = "600 24px sans-serif";
      ctx.fillText(sampleName, 50, 140);

      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(50, 180, 500, 300);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("DECLARATIONS (PCR 2011)", 50, 520);

      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("Net Quantity: 200 g", 50, 560);
      ctx.fillText("MRP: Rs. 199.00 (Incl. of all taxes)", 50, 590);
      ctx.fillText("Mfg Date: 07/2026", 50, 620);
      ctx.fillText("Consumer Care: feedback@nutrisnack.in", 50, 650);
      ctx.fillText("Country of Origin: India", 50, 680);
    }

    const mockBase64 = canvas.toDataURL("image/jpeg");
    setImages([
      {
        id: `img_sample_${Date.now()}`,
        base64: mockBase64,
        name: `${sampleName.toLowerCase().replace(/\s+/g, "_")}_label.jpg`,
        mimeType: "image/jpeg",
        imageType: "front",
      },
    ]);
  };

  // Remove Image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Run the Shared PackCheck Intelligence Pipeline
  const handleStartAnalysis = async () => {
    if (images.length === 0) {
      alert("Please upload at least one image of the product package.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setCurrentStepIndex(0);

    try {
      // Step 0: Create Inspection Case in Database
      const effectiveProductName = productName.trim() || "Packaged Product";
      const effectiveBrand = brand.trim() || "Generic";

      setCurrentStepIndex(1); // Detecting text & declarations

      const createRes = await createInspection({
        productName: effectiveProductName,
        brand: effectiveBrand,
        category: category || "Packaged Food",
        sourceType: "physical_inspection",
        locationCity: "Consumer Check",
      });

      if (!createRes.success || !createRes.inspectionId) {
        throw new Error(createRes.error || "Failed to initialize product check.");
      }

      const inspectionId = createRes.inspectionId;

      // Step 1: Upload Images
      setCurrentStepIndex(2); // Identifying product information
      const primaryImage = images[0];

      const uploadRes = await uploadInspectionImage(
        inspectionId,
        primaryImage.base64,
        primaryImage.mimeType,
        primaryImage.name,
        primaryImage.imageType || "front"
      );

      const imageId = uploadRes.imageId || `img_${Date.now()}`;

      // Step 2: Run Gemini 1.5 Flash Vision OCR & Declaration Extraction
      setCurrentStepIndex(3); // Extracting mandatory declarations
      await processImageOCR(
        inspectionId,
        imageId,
        primaryImage.base64,
        primaryImage.mimeType
      );

      // Step 3: Run Deterministic Legal Metrology PCR 2011 Engine
      setCurrentStepIndex(4); // Checking Legal Metrology requirements
      await runComplianceAnalysis(inspectionId, category || "Packaged Food");

      // Step 4: Finalize Results
      setCurrentStepIndex(5); // Preparing results
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Navigate to Consumer Result Page
      router.push(`/consumer/check/${inspectionId}`);
    } catch (err: unknown) {
      console.error("Consumer inspection error:", err);
      const msg = err instanceof Error ? err.message : "Analysis could not be completed.";
      setAnalysisError(msg);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      {/* =========================================================
          CONSUMER HEADER
      ========================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm text-white transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">PackCheck</span>
                <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900 border border-emerald-300/80">
                  CITIZEN
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">Legal Metrology Product Verifier</p>
            </div>
          </Link>

          {/* Minimal Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab("check")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "check"
                  ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Check Product
            </button>
            <Link
              href="/consumer/history"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              History
            </Link>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Help</span>
            </button>
          </nav>
        </div>

        {/* User / Sign Out */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/consumer/history"
            className="md:hidden flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>History</span>
          </Link>

          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:bg-slate-50"
          >
            Sign Out
          </Link>
        </div>
      </header>

      {/* =========================================================
          HERO SECTION
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-[#F8FAFC] px-4 sm:px-8 py-10">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-900 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Packaged Commodities Rules 2011 (PCR)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Check a Product Before You Buy
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Scan or upload a product package to understand its declarations and identify potential compliance issues.
          </p>
        </div>
      </section>

      {/* =========================================================
          MAIN WORKBENCH: PRODUCT CHECK & UPLOAD
      ========================================================== */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Hidden inputs for camera & file upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileChange(e)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileChange(e, "front")}
        />

        {/* PRODUCT CHECK CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ScanSearch className="h-5 w-5 text-emerald-600" />
                <span>Check a Product</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Upload a clear image of the package label or take a photo.
              </p>
            </div>

            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live AI OCR Pipeline
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer hover:-translate-y-0.5"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Product</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedImageType("front");
                fileInputRef.current?.click();
              }}
              className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs shadow-xs transition cursor-pointer hover:border-slate-400"
            >
              <Upload className="h-4 w-4 text-slate-600" />
              <span>Upload Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedImageType("ecommerce");
                fileInputRef.current?.click();
              }}
              className="flex items-center justify-center gap-2.5 p-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs shadow-xs transition cursor-pointer hover:border-slate-400"
            >
              <ShoppingBag className="h-4 w-4 text-slate-600" />
              <span>E-commerce Screenshot</span>
            </button>
          </div>

          {/* Guidance Callout */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Capture Guidance: </span>
              <span className="text-blue-800 font-medium">
                Capture the front, back, and MRP/quantity area when possible for complete Legal Metrology checking.
              </span>
            </div>
          </div>

          {/* Uploaded Evidence Cards */}
          {images.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Uploaded Evidence ({images.length})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  + Add another image
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-2xl border border-slate-200 bg-slate-50 p-2.5 flex flex-col justify-between shadow-2xs"
                  >
                    <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-200 mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.base64}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {img.imageType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]">
                        {img.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name (Optional)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Roasted Almonds"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brand / Manufacturer (Optional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. NutriSnack Foods"
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 shadow-2xs focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Commodity Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none shadow-2xs focus:border-emerald-600"
              >
                <option value="Packaged Food">Packaged Food</option>
                <option value="Edible Oils">Edible Oils</option>
                <option value="Beverages">Beverages</option>
                <option value="Cosmetics & Toiletries">Cosmetics &amp; Toiletries</option>
                <option value="Electronics">Electronics &amp; Appliances</option>
                <option value="General Merchandise">General Merchandise</option>
              </select>
            </div>
          </div>

          {/* Quick Preload Demo Packages (Optional for fast testing) */}
          <div className="pt-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Or Test with Sample Commodities:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleLoadSample("Roasted Almonds 200g", "NutriSnack Foods Ltd.", "Packaged Food", "")}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-bold text-slate-900 block">🌰 NutriSnack Roasted Almonds</span>
                <span className="text-[11px] text-slate-500 font-medium">Packaged Food • MRP ₹199</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample("Refined Mustard Oil 1L", "PureDrop Agro Mills", "Edible Oils", "")}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-bold text-slate-900 block">🛢️ PureDrop Mustard Oil 1L</span>
                <span className="text-[11px] text-slate-500 font-medium">Edible Oils • MRP ₹165</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSample("Organic Green Tea 100 Bags", "Arogya Herbal", "Beverages", "")}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition cursor-pointer text-xs"
              >
                <span className="font-bold text-slate-900 block">🍵 Arogya Green Tea Bags</span>
                <span className="text-[11px] text-slate-500 font-medium">Beverages • MRP ₹340</span>
              </button>
            </div>
          </div>

          {/* Error notice */}
          {analysisError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Primary CTA: Continue to Analysis */}
          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={images.length === 0 || isAnalyzing}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking your product...</span>
              </>
            ) : (
              <>
                <span>Continue to Analysis</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

        </div>

        {/* =========================================================
            ANALYSIS PROGRESS OVERLAY (STEP 2)
        ========================================================== */}
        {isAnalyzing && (
          <div className="p-6 rounded-3xl border-2 border-emerald-500 bg-emerald-50/50 shadow-md animate-in fade-in space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Checking your product...</h3>
                <p className="text-xs text-slate-600 font-medium">Running Legal Metrology inspection engine</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {analysisSteps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2.5 text-xs transition-colors ${
                      isCompleted
                        ? "text-emerald-800 font-bold"
                        : isCurrent
                        ? "text-blue-800 font-bold animate-pulse"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            RECENT CHECKS SECTION
        ========================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>Recent Checks</span>
            </h2>
            <Link
              href="/consumer/history"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoadingHistory ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center text-xs font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-600 mb-2" />
              Loading your previous checks...
            </div>
          ) : recentChecks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white text-center space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-extrabold text-slate-800">No product checks yet</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-medium">
                Upload a product package to perform your first Legal Metrology compliance check.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <span>Check a Product</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recentChecks.map((item) => {
                const isCompliant = item.status === "cleared" || item.status === "verified";
                const isAttention = item.status === "review_required" || item.status === "processing";
                return (
                  <Link
                    key={item.id}
                    href={`/consumer/check/${item.id}`}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-md transition shadow-2xs space-y-2.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {item.case_number}
                      </span>
                      {isCompliant ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Looks Compliant
                        </span>
                      ) : isAttention ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          Attention Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertOctagon className="h-3 w-3 text-rose-600" />
                          Potential Issue
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                        {item.product_name || "Packaged Product"}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                        {item.brand} • {item.category}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100">
                      <span>{new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        View results <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* =========================================================
          HELP & CONSUMER RIGHTS MODAL
      ========================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-w-lg w-full rounded-3xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Your Rights as a Consumer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
              <p>
                Under the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>, every packaged product in India must carry:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                <li><strong>Maximum Retail Price (MRP)</strong> inclusive of all taxes.</li>
                <li><strong>Net Quantity</strong> with proper standard metric units (g, kg, ml, L).</li>
                <li><strong>Month &amp; Year of Manufacture / Packing</strong>.</li>
                <li><strong>Name &amp; Address</strong> of Manufacturer, Packer, or Importer.</li>
                <li><strong>Consumer Care Details</strong> (Name, Phone, and Email).</li>
                <li><strong>Country of Origin</strong> for all imported goods.</li>
              </ul>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                PackCheck uses automated computer vision and OCR to inspect these declarations for you.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full h-10 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
