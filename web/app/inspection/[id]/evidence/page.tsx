"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  X,
  Edit3,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ZoomIn,
  Loader2,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceTabs } from "../overview/page";

// =========================================================================
// EVIDENCE & EXTRACTION PAGE
// =========================================================================

interface ExtractedField {
  id: string;
  field_name: string;
  field_label: string;
  raw_value: string | null;
  normalized_value: string | null;
  confidence_score: number | null;
  confidence_level: string;
  is_human_corrected: boolean;
  corrected_value: string | null;
  original_ai_value: string | null;
  review_status: string;
  extraction_status: string;
  bounding_box: Record<string, number> | null;
}

interface InspectionImage {
  id: string;
  image_type: string;
  public_url: string | null;
  storage_path: string;
  original_filename: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  product_name: "Product / Brand Name",
  generic_name: "Generic or Common Name",
  manufacturer_name: "Manufacturer / Packer Name",
  manufacturer_address: "Manufacturer / Packer Address",
  packer_name: "Packer Name",
  packer_address: "Packer Address",
  importer_name: "Importer Name",
  importer_address: "Importer Address",
  consumer_care_name: "Consumer Care Contact Name",
  consumer_care_address: "Consumer Care Address",
  consumer_care_phone: "Consumer Care Phone",
  consumer_care_email: "Consumer Care Email",
  country_of_origin: "Country of Origin",
  net_quantity: "Net Quantity",
  net_quantity_unit: "Net Quantity Unit",
  mrp: "Maximum Retail Price (MRP)",
  manufacturing_date: "Manufacturing / Packing Date",
  expiry_date: "Expiry / Best Before Date",
  batch_number: "Batch / Lot Number",
  fssai_license: "FSSAI License Number",
  ingredients_list: "Ingredients",
  number_of_units: "Number of Units (Multi-pack)",
  unit_sale_price: "Unit Sale Price",
};

const RULE_REFERENCES: Record<string, string> = {
  generic_name: "Rule 6(1)(a)",
  net_quantity: "Rule 6(1)(b)",
  net_quantity_unit: "Rule 6(1)(b)",
  manufacturer_name: "Rule 6(1)(c)",
  manufacturer_address: "Rule 6(1)(c)",
  manufacturing_date: "Rule 6(1)(d)",
  mrp: "Rule 6(1)(e)",
  consumer_care_name: "Rule 6(1)(f)",
  consumer_care_phone: "Rule 6(1)(f)",
  country_of_origin: "Rule 6(1)(g)",
  unit_sale_price: "Rule 6(1)(h)",
  expiry_date: "Rule 6(1)(i)",
};

export default function EvidencePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [images, setImages] = useState<InspectionImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fieldsRes, imagesRes] = await Promise.all([
        supabase.from("extracted_fields").select("*").eq("inspection_id", id).order("field_name"),
        supabase.from("inspection_images").select("*").eq("inspection_id", id).order("created_at"),
      ]);
      if (!fieldsRes.data || fieldsRes.data.length === 0) {
        setFields([
          {
            id: "f1",
            field_name: "product_name",
            field_label: "Product / Brand Name",
            raw_value: "NutriSnack Roasted Almonds 200g",
            normalized_value: "NutriSnack Roasted Almonds 200g",
            confidence_score: 98,
            confidence_level: "high",
            is_human_corrected: false,
            corrected_value: null,
            original_ai_value: null,
            review_status: "accepted",
            extraction_status: "ai_extracted",
            bounding_box: null,
          },
          {
            id: "f2",
            field_name: "mrp",
            field_label: "Maximum Retail Price (MRP)",
            raw_value: "₹ 199.00 (Incl. of all taxes)",
            normalized_value: "₹ 199.00",
            confidence_score: 98,
            confidence_level: "high",
            is_human_corrected: false,
            corrected_value: null,
            original_ai_value: null,
            review_status: "accepted",
            extraction_status: "ai_extracted",
            bounding_box: null,
          },
          {
            id: "f3",
            field_name: "net_quantity",
            field_label: "Net Quantity",
            raw_value: "200 g",
            normalized_value: "200 g",
            confidence_score: 91,
            confidence_level: "high",
            is_human_corrected: false,
            corrected_value: null,
            original_ai_value: null,
            review_status: "pending",
            extraction_status: "ai_extracted",
            bounding_box: null,
          },
          {
            id: "f4",
            field_name: "manufacturing_date",
            field_label: "Month & Year of Manufacture",
            raw_value: "07/2026",
            normalized_value: "2026-07",
            confidence_score: 96,
            confidence_level: "high",
            is_human_corrected: false,
            corrected_value: null,
            original_ai_value: null,
            review_status: "accepted",
            extraction_status: "ai_extracted",
            bounding_box: null,
          },
          {
            id: "f5",
            field_name: "manufacturer_name",
            field_label: "Manufacturer Details",
            raw_value: "NutriSnack Foods Ltd., Plot 42, GIDC, Gujarat",
            normalized_value: "NutriSnack Foods Ltd.",
            confidence_score: 94,
            confidence_level: "high",
            is_human_corrected: false,
            corrected_value: null,
            original_ai_value: null,
            review_status: "accepted",
            extraction_status: "ai_extracted",
            bounding_box: null,
          },
          {
            id: "f6",
            field_name: "consumer_care_phone",
            field_label: "Consumer Care Phone",
            raw_value: "1800-123-4567",
            normalized_value: "18001234567",
            confidence_score: 88,
            confidence_level: "high",
            is_human_corrected: false,
            corrected_value: null,
            original_ai_value: null,
            review_status: "accepted",
            extraction_status: "ai_extracted",
            bounding_box: null,
          },
        ]);
        setImages([
          {
            id: "img-demo-1",
            image_type: "front",
            public_url: null,
            storage_path: "demo/front.jpg",
            original_filename: "nutrisnack_almonds_front.jpg",
          },
        ]);
        setSelectedImageId("img-demo-1");
      } else {
        setFields(fieldsRes.data ?? []);
        setImages(imagesRes.data ?? []);
        if (imagesRes.data?.length) setSelectedImageId(imagesRes.data[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  // -----------------------------------------------------------------------
  // HUMAN CORRECTION
  // -----------------------------------------------------------------------

  const startEdit = (field: ExtractedField) => {
    setEditingFieldId(field.id);
    setEditValue(field.is_human_corrected ? field.corrected_value ?? "" : field.raw_value ?? "");
    setEditReason("");
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setEditValue("");
    setEditReason("");
  };

  const saveCorrection = async (field: ExtractedField) => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("extracted_fields")
      .update({
        corrected_value: editValue.trim(),
        is_human_corrected: true,
        original_ai_value: field.is_human_corrected ? field.original_ai_value : field.raw_value,
        corrected_by: user?.id,
        corrected_at: new Date().toISOString(),
        correction_reason: editReason.trim() || "Manual correction by investigator",
        review_status: "accepted",
      })
      .eq("id", field.id);

    if (!error) {
      setSaveMsg("Correction saved");
      setTimeout(() => setSaveMsg(null), 2500);
      await loadData();
    }

    setEditingFieldId(null);
    setIsSaving(false);
  };

  const acceptField = async (field: ExtractedField) => {
    await supabase
      .from("extracted_fields")
      .update({ review_status: "accepted" })
      .eq("id", field.id);
    await loadData();
  };

  const rejectField = async (field: ExtractedField) => {
    await supabase
      .from("extracted_fields")
      .update({ review_status: "rejected" })
      .eq("id", field.id);
    await loadData();
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  const selectedImage = images.find((i) => i.id === selectedImageId);
  const presentFields = fields.filter((f) => f.raw_value);
  const missingFields = fields.filter((f) => !f.raw_value);
  const correctedFields = fields.filter((f) => f.is_human_corrected);
  const acceptedFields = fields.filter((f) => f.review_status === "accepted");

  if (isLoading) {
    return (
      <div className="packcheck-workspace-loading">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-slate-500 mt-3">Loading evidence...</p>
      </div>
    );
  }

  return (
    <div className="packcheck-workspace">
      {/* HEADER */}
      <header className="packcheck-workspace-header">
        <div className="packcheck-workspace-nav">
          <Link href="/dashboard" className="packcheck-back-btn">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <Link href={`/inspection/${id}/overview`} className="text-slate-500 hover:text-slate-700 text-sm">Overview</Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="text-slate-700 font-medium text-sm">Evidence</span>
        </div>
        {saveMsg && (
          <div className="packcheck-save-toast">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{saveMsg}</span>
          </div>
        )}
      </header>

      <WorkspaceTabs inspectionId={id} activeTab="evidence" />

      <div className="packcheck-evidence-layout">
        {/* LEFT: IMAGE VIEWER */}
        <div className="packcheck-evidence-image-panel">
          <div className="packcheck-evidence-image-header">
            <h2 className="packcheck-section-title">Package Images</h2>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500">Click image to zoom</span>
            </div>
          </div>

          {/* IMAGE THUMBNAILS */}
          <div className="packcheck-image-thumbnails">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageId(img.id)}
                className={`packcheck-image-thumb-btn ${selectedImageId === img.id ? "packcheck-image-thumb-active" : ""}`}
              >
                {img.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.public_url} alt={img.image_type} className="h-12 w-12 object-cover rounded" />
                ) : (
                  <div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center">
                    <Eye className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <span className="text-xs capitalize">{img.image_type.replace("_", " ")}</span>
              </button>
            ))}
          </div>

          {/* MAIN IMAGE */}
          <div className="packcheck-evidence-main-image">
            {selectedImage?.public_url ? (
              <div
                className="packcheck-image-container group cursor-zoom-in"
                onClick={() => setZoomedImage(selectedImage.public_url!)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.public_url}
                  alt={selectedImage.image_type}
                  className="packcheck-evidence-img"
                />
                <div className="packcheck-image-zoom-hint">
                  <ZoomIn className="h-5 w-5" />
                  Click to zoom
                </div>
              </div>
            ) : (
              <div className="packcheck-evidence-placeholder">
                <Eye className="h-12 w-12 text-slate-200" />
                <p className="text-slate-400 text-sm mt-2">No image available</p>
                <p className="text-slate-300 text-xs">Image may still be processing or upload failed</p>
              </div>
            )}
          </div>

          {/* IMAGE INFO */}
          {selectedImage && (
            <div className="packcheck-image-info">
              <span className="capitalize font-medium text-slate-700">{selectedImage.image_type.replace("_", " ")} Label</span>
              {selectedImage.original_filename && (
                <span className="text-slate-400 text-xs">{selectedImage.original_filename}</span>
              )}
            </div>
          )}

          {/* DISCLAIMER */}
          <div className="packcheck-evidence-disclaimer">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-slate-500">
              AI extraction is assistive only. All extracted values must be verified against the physical package by an authorized officer.
            </p>
          </div>
        </div>

        {/* RIGHT: EXTRACTION FIELDS */}
        <div className="packcheck-evidence-fields-panel">
          <div className="packcheck-evidence-fields-header">
            <div>
              <h2 className="packcheck-section-title">Extracted Declarations</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {presentFields.length} extracted · {correctedFields.length} corrected · {acceptedFields.length} accepted
              </p>
            </div>
            <div className="packcheck-evidence-legend">
              <div className="packcheck-legend-item">
                <div className="packcheck-legend-dot packcheck-legend-high" />
                <span>High confidence</span>
              </div>
              <div className="packcheck-legend-item">
                <div className="packcheck-legend-dot packcheck-legend-medium" />
                <span>Medium</span>
              </div>
              <div className="packcheck-legend-item">
                <div className="packcheck-legend-dot packcheck-legend-low" />
                <span>Low / needs verification</span>
              </div>
            </div>
          </div>

          {/* FIELDS LIST */}
          <div className="packcheck-fields-list">
            {fields.map((field) => {
              const ruleRef = RULE_REFERENCES[field.field_name];
              const isEditing = editingFieldId === field.id;
              const conf = Number(field.confidence_score ?? 0);
              const confClass = conf >= 80 ? "packcheck-conf-high" : conf >= 50 ? "packcheck-conf-medium" : field.raw_value ? "packcheck-conf-low" : "packcheck-conf-none";

              return (
                <div
                  key={field.id}
                  className={`packcheck-field-card ${!field.raw_value ? "packcheck-field-missing" : ""} ${field.review_status === "accepted" ? "packcheck-field-accepted" : ""} ${field.is_human_corrected ? "packcheck-field-corrected" : ""}`}
                >
                  <div className="packcheck-field-header">
                    <div className="packcheck-field-label-row">
                      <div className={`packcheck-field-indicator ${confClass}`} />
                      <div>
                        <span className="packcheck-field-label">
                          {FIELD_LABELS[field.field_name] ?? field.field_label ?? field.field_name}
                        </span>
                        {ruleRef && (
                          <span className="packcheck-field-rule-ref">{ruleRef}</span>
                        )}
                      </div>
                    </div>
                    <div className="packcheck-field-actions">
                      {field.raw_value && !isEditing && (
                        <>
                          {field.review_status !== "accepted" && (
                            <button
                              onClick={() => acceptField(field)}
                              className="packcheck-field-btn packcheck-field-btn-accept"
                              title="Accept this value"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(field)}
                            className="packcheck-field-btn packcheck-field-btn-edit"
                            title="Correct this value"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {field.review_status !== "rejected" && (
                            <button
                              onClick={() => rejectField(field)}
                              className="packcheck-field-btn packcheck-field-btn-reject"
                              title="Mark as incorrect"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* FIELD VALUE */}
                  {isEditing ? (
                    <div className="packcheck-field-edit">
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="packcheck-input packcheck-field-edit-input"
                        placeholder="Enter corrected value..."
                      />
                      <input
                        type="text"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="packcheck-input packcheck-field-edit-reason"
                        placeholder="Reason for correction (optional)..."
                      />
                      <div className="packcheck-field-edit-actions">
                        <button
                          onClick={cancelEdit}
                          className="packcheck-field-btn packcheck-field-btn-cancel"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                        <button
                          onClick={() => saveCorrection(field)}
                          disabled={isSaving}
                          className="packcheck-field-btn packcheck-field-btn-save"
                        >
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="packcheck-field-value-row">
                      {field.is_human_corrected ? (
                        <div className="packcheck-field-corrected-display">
                          <span className="packcheck-field-value packcheck-field-value-corrected">{field.corrected_value}</span>
                          <span className="packcheck-corrected-badge">
                            <Edit3 className="h-3 w-3" />
                            Corrected
                          </span>
                          {field.original_ai_value && (
                            <div className="packcheck-field-original">
                              Original AI: <span className="line-through text-slate-400">{field.original_ai_value}</span>
                            </div>
                          )}
                        </div>
                      ) : field.raw_value ? (
                        <span className="packcheck-field-value">{field.raw_value}</span>
                      ) : (
                        <span className="packcheck-field-missing-text">
                          Not detected on package image
                        </span>
                      )}

                      {/* CONFIDENCE BAR */}
                      {field.raw_value && (
                        <div className="packcheck-field-confidence">
                          <div className="packcheck-confidence-bar">
                            <div className={`packcheck-confidence-fill ${confClass}`} style={{ width: `${conf}%` }} />
                          </div>
                          <span className="packcheck-confidence-pct">{Math.round(conf)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* REVIEW STATUS */}
                  <div className="packcheck-field-footer">
                    <span className={`packcheck-badge ${field.review_status === "accepted" ? "packcheck-badge-green" : field.review_status === "rejected" ? "packcheck-badge-red" : "packcheck-badge-slate"}`}>
                      {field.review_status === "accepted" ? "✓ Accepted" : field.review_status === "rejected" ? "✗ Rejected" : "Pending Review"}
                    </span>
                    <span className="packcheck-badge packcheck-badge-slate">
                      {field.extraction_status === "human_corrected" ? "Human Corrected" : "AI Extracted"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MISSING FIELDS WARNING */}
          {missingFields.length > 0 && (
            <div className="packcheck-missing-warning">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-amber-700">
                <span className="font-medium">{missingFields.length} field{missingFields.length !== 1 ? "s" : ""} not detected</span> on this image.
                Upload additional images (e.g., back label) or manually enter missing values.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ZOOM LIGHTBOX */}
      {zoomedImage && (
        <div
          className="packcheck-lightbox"
          onClick={() => setZoomedImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomedImage} alt="Zoomed" className="packcheck-lightbox-img" />
          <button className="packcheck-lightbox-close" onClick={() => setZoomedImage(null)}>
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
