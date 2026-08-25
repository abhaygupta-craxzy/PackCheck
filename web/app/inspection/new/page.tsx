"use client";

import React, { useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  Building2,
  Tag,
  Globe,
  MapPin,
  FolderOpen,
  Plus,
  Eye,
} from "lucide-react";
import { createInspection, uploadInspectionImage, processImageOCR, runComplianceAnalysis } from "@/lib/actions/inspection";

// =========================================================================
// TYPES
// =========================================================================

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  type: "front" | "back" | "side" | "close_up" | "ecommerce";
  uploadedImageId?: string;
  uploadStatus: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const IMAGE_TYPES = [
  { value: "front", label: "Front Label", desc: "Principal display panel — MRP, net quantity, brand name" },
  { value: "back", label: "Back Label", desc: "Manufacturer details, ingredients, nutrition, consumer care" },
  { value: "side", label: "Side Panel", desc: "Additional declarations, barcodes" },
  { value: "close_up", label: "Close-Up", desc: "Small print, dates, lot numbers" },
  { value: "ecommerce", label: "E-Commerce Screenshot", desc: "Online listing image" },
];

const CATEGORIES = [
  "Packaged Food",
  "Edible Oils",
  "Cosmetics",
  "Personal Care",
  "Beverages",
  "Electronics",
  "Other Packaged Commodities",
];

const SOURCE_TYPES = [
  { value: "physical_inspection", label: "Physical Inspection", desc: "Product in hand at market/warehouse" },
  { value: "ecommerce_listing", label: "E-Commerce Listing", desc: "Online marketplace product page" },
  { value: "citizen_report", label: "Citizen Report", desc: "Consumer complaint / tip-off" },
  { value: "batch_audit", label: "Batch Audit", desc: "Scheduled manufacturer batch review" },
];

// =========================================================================
// PIPELINE STEP
// =========================================================================

type PipelineStep =
  | { key: "upload"; label: "Upload Images"; done: boolean }
  | { key: "metadata"; label: "Product Details"; done: boolean }
  | { key: "processing"; label: "AI Analysis"; done: boolean }
  | { key: "done"; label: "Ready"; done: boolean };

// =========================================================================
// MAIN PAGE
// =========================================================================

export default function NewInspectionPage() {

  // Step management
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);

  // Images
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Metadata form
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sourceType, setSourceType] = useState(SOURCE_TYPES[0].value);
  const [marketplaceUrl, setMarketplaceUrl] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [isImported, setIsImported] = useState(false);

  // Processing state
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // IMAGE HANDLING
  // -----------------------------------------------------------------------

  const handleFileDrop = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (images.length + newImages.length >= 8) return;
      newImages.push({
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        type: "front",
        uploadStatus: "pending",
      });
    });
    setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileDrop(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateImageType = (id: string, type: UploadedImage["type"]) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, type } : i)));
  };

  // -----------------------------------------------------------------------
  // STEP 0 → 1 (at least one image)
  // -----------------------------------------------------------------------

  const goToMetadata = () => {
    if (images.length === 0) return;
    setCurrentStep(1);
  };

  // -----------------------------------------------------------------------
  // STEP 1 → 2 (create inspection + upload images + run AI)
  // -----------------------------------------------------------------------

  const handleStartAnalysis = async () => {
    if (!productName.trim() || !brand.trim()) return;

    setIsCreating(true);
    setProcessingError(null);

    // 1. Create inspection record
    const createResult = await createInspection({
      productName: productName.trim(),
      brand: brand.trim(),
      category,
      sourceType,
      marketplaceUrl: marketplaceUrl.trim() || undefined,
      locationCity: locationCity.trim() || undefined,
    });

    if (!createResult.success || !createResult.inspectionId) {
      setProcessingError(createResult.error ?? "Failed to create inspection");
      setIsCreating(false);
      return;
    }

    const newInspectionId = createResult.inspectionId;
    setInspectionId(newInspectionId);
    setCaseNumber(createResult.caseNumber ?? null);
    setIsCreating(false);

    // Move to processing step
    setCurrentStep(2);
    setIsProcessing(true);

    try {
      // 2. Upload all images
      setProcessingStage("Uploading images to secure storage...");
      setProcessingProgress(10);
      let uploadedCount = 0;
      const uploadedImageIds: string[] = [];
      const cachedImages: any[] = [];

      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, uploadStatus: "uploading" } : i))
        );

        // Convert to base64
        const base64 = await fileToBase64(img.file);

        const uploadResult = await uploadInspectionImage(
          newInspectionId,
          base64,
          img.file.type,
          img.file.name,
          img.type
        );

        const imgId = uploadResult.imageId || `img_${Date.now()}_${idx}`;
        uploadedImageIds.push(imgId);
        cachedImages.push({
          id: imgId,
          public_url: uploadResult.publicUrl || base64,
          base64: base64,
          image_type: img.type,
          original_filename: img.file.name,
        });

        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, uploadStatus: "done", uploadedImageId: imgId }
              : i
          )
        );

        uploadedCount++;
        setProcessingProgress(10 + Math.floor((uploadedCount / images.length) * 30));
      }

      // Persist to client storage cache
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            `packcheck_images_${newInspectionId}`,
            JSON.stringify(cachedImages)
          );
          localStorage.setItem(
            `packcheck_images_${newInspectionId}`,
            JSON.stringify(cachedImages)
          );
          if (cachedImages[0]?.base64) {
            sessionStorage.setItem("packcheck_last_image", cachedImages[0].base64);
            localStorage.setItem("packcheck_last_image", cachedImages[0].base64);
          }

          const inspectionObj = {
            id: newInspectionId,
            case_number: createResult.caseNumber || `LM-2026-${newInspectionId.slice(-4)}`,
            title: `${brand.trim()} — ${productName.trim()}`,
            product_name: productName.trim(),
            brand: brand.trim(),
            category: category,
            status: "draft",
            created_at: new Date().toISOString(),
          };
          sessionStorage.setItem(
            `packcheck_inspection_${newInspectionId}`,
            JSON.stringify(inspectionObj)
          );
          localStorage.setItem(
            `packcheck_inspection_${newInspectionId}`,
            JSON.stringify(inspectionObj)
          );
        } catch (e) {
          console.warn("Storage cache write notice:", e);
        }
      }

      // 3. Run OCR on primary/front image
      setProcessingStage("Running Gemini Vision OCR...");
      setProcessingProgress(45);

      const primaryImage = images.find((i) => i.type === "front") ?? images[0];
      if (primaryImage) {
        const base64 = await fileToBase64(primaryImage.file);
        const primaryId = uploadedImageIds[0] || `img_front_${Date.now()}`;
        await processImageOCR(newInspectionId, primaryId, base64, primaryImage.file.type);
      }
      setProcessingProgress(70);

      // OCR on back image if present
      const backImage = images.find((i) => i.type === "back");
      if (backImage) {
        setProcessingStage("Extracting back label declarations...");
        const base64 = await fileToBase64(backImage.file);
        const backId = uploadedImageIds[1] || `img_back_${Date.now()}`;
        await processImageOCR(newInspectionId, backId, base64, backImage.file.type);
      }
      setProcessingProgress(80);

      // 4. Run compliance analysis
      setProcessingStage("Running Legal Metrology compliance analysis...");
      setProcessingProgress(85);
      await runComplianceAnalysis(newInspectionId, category);
      setProcessingProgress(100);

      setProcessingStage("Analysis complete!");
      setIsProcessing(false);
      setCurrentStep(3);
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : "Processing failed");
      setIsProcessing(false);
    }
  };

  // -----------------------------------------------------------------------
  // HELPER
  // -----------------------------------------------------------------------

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  const steps = ["Upload Images", "Product Details", "AI Analysis", "Ready"];

  return (
    <div className="packcheck-intake-page">
      {/* HEADER */}
      <header className="packcheck-intake-header">
        <Link href="/investigator" className="packcheck-back-btn">
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        <div className="packcheck-intake-brand">
          <div className="packcheck-intake-icon">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="packcheck-intake-title">New Inspection</span>
        </div>

        {caseNumber && (
          <div className="packcheck-intake-case">
            Case: <span className="font-mono font-semibold">{caseNumber}</span>
          </div>
        )}
      </header>

      {/* STEPPER */}
      <div className="packcheck-stepper">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className={`packcheck-step ${currentStep >= idx ? "packcheck-step-done" : ""} ${currentStep === idx ? "packcheck-step-active" : ""}`}>
              <div className="packcheck-step-circle">
                {currentStep > idx ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="packcheck-step-label">{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`packcheck-step-connector ${currentStep > idx ? "packcheck-step-connector-done" : ""}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 0 — UPLOAD */}
      {currentStep === 0 && (
        <div className="packcheck-intake-content">
          <div className="packcheck-intake-section-title">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <div>
              <h2>Upload Package Images</h2>
              <p>Upload clear photos of the package label. Multiple angles improve extraction accuracy.</p>
            </div>
          </div>

          {/* DROPZONE */}
          <div
            className={`packcheck-dropzone ${isDragging ? "packcheck-dropzone-active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileDrop(e.target.files)}
            />
            <div className="packcheck-dropzone-icon">
              <Upload className="h-8 w-8 text-blue-400" />
            </div>
            <p className="packcheck-dropzone-title">Drop images here or click to browse</p>
            <p className="packcheck-dropzone-subtitle">JPG, PNG, WEBP · Up to 8 images · Max 20MB each</p>
            <div className="packcheck-dropzone-tips">
              <div className="packcheck-dropzone-tip">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Good lighting, no glare</span>
              </div>
              <div className="packcheck-dropzone-tip">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Text clearly legible</span>
              </div>
              <div className="packcheck-dropzone-tip">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Front + back recommended</span>
              </div>
            </div>
          </div>

          {/* IMAGE PREVIEW GRID */}
          {images.length > 0 && (
            <div className="packcheck-image-grid">
              {images.map((img) => (
                <div key={img.id} className="packcheck-image-card">
                  <div className="packcheck-image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt={img.file.name} className="packcheck-image-thumb" />
                    <button
                      className="packcheck-image-remove"
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <select
                    value={img.type}
                    onChange={(e) => updateImageType(img.id, e.target.value as UploadedImage["type"])}
                    className="packcheck-image-type-select"
                  >
                    {IMAGE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <p className="packcheck-image-filename">{img.file.name.slice(0, 20)}{img.file.name.length > 20 ? "…" : ""}</p>
                </div>
              ))}

              {images.length < 8 && (
                <button
                  className="packcheck-image-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-6 w-6 text-slate-400" />
                  <span className="text-sm text-slate-500">Add more</span>
                </button>
              )}
            </div>
          )}

          <div className="packcheck-intake-actions">
            <button
              onClick={goToMetadata}
              disabled={images.length === 0}
              className="packcheck-btn-primary"
            >
              Continue to Product Details
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — METADATA */}
      {currentStep === 1 && (
        <div className="packcheck-intake-content">
          <div className="packcheck-intake-section-title">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <h2>Product Details</h2>
              <p>Provide metadata to help the AI engine and rules engine contextualize the inspection.</p>
            </div>
          </div>

          <div className="packcheck-form">
            <div className="packcheck-form-row">
              <div className="packcheck-form-group">
                <label className="packcheck-label">
                  <Tag className="h-4 w-4" />
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Roasted Almonds 200g"
                  className="packcheck-input"
                />
              </div>
              <div className="packcheck-form-group">
                <label className="packcheck-label">
                  <Building2 className="h-4 w-4" />
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., NutriSnack Foods Ltd."
                  className="packcheck-input"
                />
              </div>
            </div>

            <div className="packcheck-form-row">
              <div className="packcheck-form-group">
                <label className="packcheck-label">
                  <FolderOpen className="h-4 w-4" />
                  Product Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="packcheck-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="packcheck-field-hint">Determines applicable Legal Metrology rules</p>
              </div>
              <div className="packcheck-form-group">
                <label className="packcheck-label">
                  <Eye className="h-4 w-4" />
                  Inspection Source
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="packcheck-input"
                >
                  {SOURCE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="packcheck-form-row">
              <div className="packcheck-form-group">
                <label className="packcheck-label">
                  <MapPin className="h-4 w-4" />
                  Location / City
                </label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                  className="packcheck-input"
                />
              </div>
              <div className="packcheck-form-group">
                <label className="packcheck-label">
                  <Globe className="h-4 w-4" />
                  Marketplace URL
                </label>
                <input
                  type="url"
                  value={marketplaceUrl}
                  onChange={(e) => setMarketplaceUrl(e.target.value)}
                  placeholder="https://amazon.in/dp/..."
                  className="packcheck-input"
                />
              </div>
            </div>

            <div className="packcheck-form-group">
              <label className="packcheck-checkbox-label">
                <input
                  type="checkbox"
                  checked={isImported}
                  onChange={(e) => setIsImported(e.target.checked)}
                  className="packcheck-checkbox"
                />
                <Globe className="h-4 w-4 text-slate-400" />
                <span>This product is imported (triggers Rule 6(1)(g) — Country of Origin check)</span>
              </label>
            </div>

            {/* IMAGES SUMMARY */}
            <div className="packcheck-images-summary">
              <div className="packcheck-images-summary-title">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                <span>{images.length} image{images.length !== 1 ? "s" : ""} ready for analysis</span>
              </div>
              <div className="packcheck-images-summary-list">
                {images.map((img) => (
                  <div key={img.id} className="packcheck-images-summary-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="" className="h-8 w-8 rounded object-cover" />
                    <span className="text-xs text-slate-600 capitalize">{img.type.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {processingError && (
            <div className="packcheck-error-banner">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{processingError}</span>
            </div>
          )}

          <div className="packcheck-intake-actions">
            <button onClick={() => setCurrentStep(0)} className="packcheck-btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={!productName.trim() || !brand.trim() || isCreating}
              className="packcheck-btn-primary"
            >
              {isCreating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating inspection...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Start AI Analysis</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — PROCESSING */}
      {currentStep === 2 && (
        <div className="packcheck-intake-content packcheck-processing">
          <div className="packcheck-processing-animation">
            <div className="packcheck-processing-rings">
              <div className="packcheck-ring packcheck-ring-1" />
              <div className="packcheck-ring packcheck-ring-2" />
              <div className="packcheck-ring packcheck-ring-3" />
              <div className="packcheck-processing-core">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <h2 className="packcheck-processing-title">AI Analysis in Progress</h2>
          <p className="packcheck-processing-subtitle">
            Gemini Vision is analyzing your package images and extracting declarations...
          </p>

          {/* PROGRESS BAR */}
          <div className="packcheck-progress-wrapper">
            <div className="packcheck-progress-bar">
              <div
                className="packcheck-progress-fill"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="packcheck-progress-labels">
              <span className="packcheck-processing-stage">{processingStage}</span>
              <span className="packcheck-progress-pct">{processingProgress}%</span>
            </div>
          </div>

          {/* IMAGE UPLOAD STATUS */}
          <div className="packcheck-upload-status">
            {images.map((img) => (
              <div key={img.id} className="packcheck-upload-status-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt="" className="h-8 w-8 rounded object-cover" />
                <span className="text-sm text-slate-600 capitalize flex-1">{img.type.replace("_", " ")}</span>
                {img.uploadStatus === "uploading" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                {img.uploadStatus === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {img.uploadStatus === "error" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {img.uploadStatus === "pending" && <div className="h-4 w-4 rounded-full border-2 border-slate-200" />}
              </div>
            ))}
          </div>

          <div className="packcheck-processing-disclaimer">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p>AI extraction is assistive only. A Legal Metrology Officer must review and confirm all findings before any enforcement action.</p>
          </div>

          {processingError && (
            <div className="packcheck-error-banner">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{processingError}</span>
              <Link href="/investigator" className="ml-auto text-sm underline">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — DONE */}
      {currentStep === 3 && inspectionId && (
        <div className="packcheck-intake-content packcheck-done">
          <div className="packcheck-done-icon">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="packcheck-done-title">Analysis Complete</h2>
          <p className="packcheck-done-subtitle">
            AI has analyzed your package and identified declarations and compliance findings.
            {caseNumber && <><br />Case Number: <span className="font-mono font-semibold">{caseNumber}</span></>}
          </p>

          <div className="packcheck-done-disclaimer">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700">Human Review Required</p>
              <p className="text-sm text-slate-500 mt-1">
                All AI-extracted declarations and compliance findings must be reviewed and confirmed by an authorized Legal Metrology Officer before any enforcement action is taken. AI analysis is assistive and advisory only.
              </p>
            </div>
          </div>

          <div className="packcheck-done-actions">
            <Link href={`/inspection/${inspectionId}/evidence`} className="packcheck-done-action packcheck-done-action-primary">
              <Eye className="h-5 w-5" />
              <div>
                <div className="font-medium">Review Evidence</div>
                <div className="text-sm opacity-80">View annotated image and OCR tokens</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Link>
            <Link href={`/inspection/${inspectionId}/compliance`} className="packcheck-done-action packcheck-done-action-amber">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-medium">Compliance Findings</div>
                <div className="text-sm opacity-80">Review and confirm AI-flagged issues</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Link>
            <Link href={`/inspection/${inspectionId}/overview`} className="packcheck-done-action packcheck-done-action-slate">
              <Package className="h-5 w-5" />
              <div>
                <div className="font-medium">Inspection Overview</div>
                <div className="text-sm opacity-80">Full inspection record</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
