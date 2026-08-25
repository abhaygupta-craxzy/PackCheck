/**
 * PackCheck — Legal Metrology Compliance Engine
 * Deterministic rule evaluator for PCR 2011 (India)
 * NO LLM is used for compliance decisions. All evaluations are deterministic.
 */

import rulesData from "@/lib/rules/pcr_2011.json";

// =========================================================================
// TYPES
// =========================================================================

export interface ExtractedField {
  fieldName: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number; // 0-100
  isPresent: boolean;
  isHumanCorrected?: boolean;
  correctedValue?: string;
}

export interface ExtractedDeclarations {
  [fieldName: string]: ExtractedField;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  section: string;
  title: string;
  fieldName: string;
  status: "pass" | "potential_non_compliance" | "not_detected" | "not_determinable" | "not_applicable" | "requires_review";
  severity: "critical" | "warning" | "advisory" | "compliant";
  observedValue: string | null;
  expectedRequirement: string;
  explanation: string;
  requiresPhysicalMeasurement: boolean;
  confidenceScore: number; // how confident the engine is in this evaluation
  evidenceNote?: string;
}

export interface ComplianceReport {
  inspectionId: string;
  productCategory: string;
  rulesetVersion: string;
  evaluations: RuleEvaluationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    potentialNonCompliance: number;
    notDetected: number;
    notDeterminable: number;
    notApplicable: number;
    requiresReview: number;
    requiresPhysicalMeasurement: number;
    overallStatus: "compliant" | "potential_issues" | "non_compliant" | "requires_investigator_review";
  };
  evaluatedAt: string;
}

// =========================================================================
// COMPLIANCE ENGINE
// =========================================================================

export class ComplianceEngine {
  private rules = rulesData.rules;
  private categories = rulesData.product_categories;
  private rulesetVersion = rulesData.version;

  /**
   * Evaluate all applicable rules for a given product category.
   * This is the main entry point. Always deterministic — no AI.
   */
  evaluate(
    inspectionId: string,
    productCategory: string,
    declarations: ExtractedDeclarations,
    isImported: boolean = false
  ): ComplianceReport {
    const normalizedCategory = this.normalizeCategory(productCategory);
    const applicableRuleIds = this.getApplicableRules(normalizedCategory);
    const evaluations: RuleEvaluationResult[] = [];

    for (const ruleId of applicableRuleIds) {
      const rule = this.rules.find((r) => r.id === ruleId);
      if (!rule) continue;

      const result = this.evaluateRule(rule, declarations, isImported, normalizedCategory);
      evaluations.push(result);
    }

    const summary = this.summarize(evaluations);

    return {
      inspectionId,
      productCategory: normalizedCategory,
      rulesetVersion: this.rulesetVersion,
      evaluations,
      summary,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  private evaluateRule(
    rule: (typeof rulesData.rules)[0],
    declarations: ExtractedDeclarations,
    isImported: boolean,
    category: string
  ): RuleEvaluationResult {
    const fieldName = rule.field;
    const field = declarations[fieldName];
    const evaluation = rule.evaluation as Record<string, unknown>;

    let status: RuleEvaluationResult["status"] = "not_detected";
    let explanation = "";
    let confidenceScore = 0;
    const requiresPhysicalMeasurement = !!(rule as Record<string, unknown>).requires_physical_measurement || !!(evaluation.requires_physical_measurement);

    // Check applicability
    if (rule.id === "PCR-2011-RULE-6-1-G" && !isImported) {
      return {
        ruleId: rule.id,
        ruleCode: rule.code,
        section: rule.section,
        title: rule.title,
        fieldName,
        status: "not_applicable",
        severity: "compliant",
        observedValue: null,
        expectedRequirement: evaluation.pass_condition as string,
        explanation: "Not applicable: product appears to be domestically manufactured.",
        requiresPhysicalMeasurement: false,
        confidenceScore: 80,
      };
    }

    if (rule.id === "PCR-2011-SCHEDULE-1-MPE" || requiresPhysicalMeasurement) {
      return {
        ruleId: rule.id,
        ruleCode: rule.code,
        section: rule.section,
        title: rule.title,
        fieldName,
        status: "not_determinable",
        severity: "advisory",
        observedValue: field?.normalizedValue ?? null,
        expectedRequirement: evaluation.pass_condition as string,
        explanation: "This check requires physical measurement by an authorized officer. It cannot be determined from the package image alone.",
        requiresPhysicalMeasurement: true,
        confidenceScore: 100,
      };
    }

    if (rule.id === "PCR-2011-RULE-7-NUMERAL-SIZE") {
      return {
        ruleId: rule.id,
        ruleCode: rule.code,
        section: rule.section,
        title: rule.title,
        fieldName,
        status: "not_determinable",
        severity: "advisory",
        observedValue: field?.normalizedValue ?? null,
        expectedRequirement: evaluation.pass_condition as string,
        explanation: "Numeral size measurement requires physical measurement of the package display panel. AI can only note this as requiring review.",
        requiresPhysicalMeasurement: true,
        confidenceScore: 100,
      };
    }

    // Standard checks
    switch (rule.check_type) {
      case "presence":
        ({ status, explanation, confidenceScore } = this.checkPresence(field, evaluation));
        break;
      case "presence_and_format":
        ({ status, explanation, confidenceScore } = this.checkPresenceAndFormat(field, evaluation, rule.id));
        break;
      case "conditional_presence":
        ({ status, explanation, confidenceScore } = this.checkConditionalPresence(field, evaluation, rule, category));
        break;
      case "unit_appropriateness":
        ({ status, explanation, confidenceScore } = this.checkUnitAppropriateness(field, evaluation, category));
        break;
      case "placement":
        ({ status, explanation, confidenceScore } = this.checkPlacement(field, evaluation));
        break;
      default:
        status = "requires_review";
        explanation = "Unknown check type — requires manual review.";
        confidenceScore = 50;
    }

    const severity = this.determineSeverity(rule, status);

    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      section: rule.section,
      title: rule.title,
      fieldName,
      status,
      severity,
      observedValue: field?.normalizedValue ?? field?.rawValue ?? null,
      expectedRequirement: evaluation.pass_condition as string,
      explanation,
      requiresPhysicalMeasurement,
      confidenceScore,
    };
  }

  // -----------------------------------------------------------------------
  private checkPresence(
    field: ExtractedField | undefined,
    evaluation: Record<string, unknown>
  ): { status: RuleEvaluationResult["status"]; explanation: string; confidenceScore: number } {
    if (!field || !field.isPresent || !field.rawValue) {
      return {
        status: "not_detected",
        explanation: `Field not detected in the package image. ${evaluation.fail_condition}`,
        confidenceScore: 70,
      };
    }
    if (field.confidence < 50) {
      return {
        status: "requires_review",
        explanation: `Field detected with low confidence (${field.confidence}%). Investigator should verify.`,
        confidenceScore: 60,
      };
    }
    return {
      status: "pass",
      explanation: `${evaluation.pass_condition as string} — Detected: "${field.normalizedValue ?? field.rawValue}".`,
      confidenceScore: field.confidence,
    };
  }

  // -----------------------------------------------------------------------
  private checkPresenceAndFormat(
    field: ExtractedField | undefined,
    evaluation: Record<string, unknown>,
    ruleId: string
  ): { status: RuleEvaluationResult["status"]; explanation: string; confidenceScore: number } {
    if (!field || !field.isPresent || !field.rawValue) {
      return {
        status: "not_detected",
        explanation: `Declaration not found on package. ${evaluation.fail_condition}`,
        confidenceScore: 70,
      };
    }

    const value = field.normalizedValue ?? field.rawValue;

    // MRP-specific format checks
    if (ruleId === "PCR-2011-RULE-6-1-E") {
      const mrpPrefixes = (evaluation.required_prefix as string[]) || ["₹", "Rs", "INR", "MRP"];
      const hasMrpPrefix = mrpPrefixes.some((p) => value.includes(p));
      const hasNumericValue = /\d/.test(value);

      if (!hasMrpPrefix) {
        return {
          status: "potential_non_compliance",
          explanation: `MRP detected ("${value}") but does not appear to include standard currency prefix (₹/Rs./INR). Verify declaration.`,
          confidenceScore: 75,
        };
      }
      if (!hasNumericValue) {
        return {
          status: "potential_non_compliance",
          explanation: `MRP declaration found but no numeric value detected. AI may have missed the value.`,
          confidenceScore: 60,
        };
      }
      return {
        status: "pass",
        explanation: `MRP declaration found: "${value}". Appears to include currency symbol. Verify tax-inclusive statement if visible.`,
        confidenceScore: field.confidence,
      };
    }

    // Net quantity format checks
    if (ruleId === "PCR-2011-RULE-6-1-B") {
      const allowedUnits = (evaluation.allowed_units as string[]) || [];
      const hasUnit = allowedUnits.some((u) => value.toLowerCase().includes(u.toLowerCase()));
      const hasNumeric = /\d/.test(value);

      if (!hasNumeric) {
        return {
          status: "potential_non_compliance",
          explanation: `Net quantity found ("${value}") but no numeric value detected. May be incorrectly formatted.`,
          confidenceScore: 65,
        };
      }
      if (!hasUnit) {
        return {
          status: "potential_non_compliance",
          explanation: `Net quantity found ("${value}") but unit of measure not recognized as standard SI unit.`,
          confidenceScore: 70,
        };
      }
      return {
        status: "pass",
        explanation: `Net quantity declared: "${value}". Numeric value and recognized SI unit present.`,
        confidenceScore: field.confidence,
      };
    }

    // Manufacturing date format check
    if (ruleId === "PCR-2011-RULE-6-1-D") {
      const datePatterns = [
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-\/]\d{4}\b/i,
        /\b\d{1,2}[\s\-\/]\d{4}\b/,
        /\b\d{4}[\s\-\/]\d{1,2}\b/,
        /\b(0[1-9]|1[0-2])[\-\/]\d{4}\b/,
      ];
      const hasDate = datePatterns.some((p) => p.test(value));
      if (!hasDate) {
        return {
          status: "potential_non_compliance",
          explanation: `Manufacturing/packing date found ("${value}") but format does not appear to include both month and year. Verify.`,
          confidenceScore: 65,
        };
      }
      return {
        status: "pass",
        explanation: `Manufacturing/packing date declared: "${value}". Month and year pattern detected.`,
        confidenceScore: field.confidence,
      };
    }

    return {
      status: "pass",
      explanation: `Declaration found: "${value}".`,
      confidenceScore: field.confidence,
    };
  }

  // -----------------------------------------------------------------------
  private checkConditionalPresence(
    field: ExtractedField | undefined,
    evaluation: Record<string, unknown>,
    rule: (typeof rulesData.rules)[0],
    category: string
  ): { status: RuleEvaluationResult["status"]; explanation: string; confidenceScore: number } {
    // Expiry date: required for food, cosmetics, beverages
    if (rule.id === "PCR-2011-RULE-6-1-I") {
      const requiresExpiry = ["packaged_food", "edible_oils", "cosmetics", "beverages", "personal_care"].includes(category);
      if (!requiresExpiry) {
        return { status: "not_applicable", explanation: "Expiry date not mandated for this product category.", confidenceScore: 90 };
      }
      if (!field?.isPresent) {
        return {
          status: "potential_non_compliance",
          explanation: `Expiry or 'Best Before' date not detected for a product category that requires it. ${evaluation.fail_condition}`,
          confidenceScore: 75,
        };
      }
      return {
        status: "pass",
        explanation: `Expiry/Best Before date detected: "${field.normalizedValue ?? field.rawValue}".`,
        confidenceScore: field.confidence,
      };
    }

    // Country of origin: only required for imported
    if (rule.id === "PCR-2011-RULE-6-1-G") {
      if (!field?.isPresent) {
        return { status: "not_applicable", explanation: "Country of origin not detected. If product is imported, this is required.", confidenceScore: 60 };
      }
      return {
        status: "pass",
        explanation: `Country of origin declared: "${field.normalizedValue ?? field.rawValue}".`,
        confidenceScore: field.confidence,
      };
    }

    return this.checkPresence(field, evaluation);
  }

  // -----------------------------------------------------------------------
  private checkUnitAppropriateness(
    field: ExtractedField | undefined,
    evaluation: Record<string, unknown>,
    category: string
  ): { status: RuleEvaluationResult["status"]; explanation: string; confidenceScore: number } {
    if (!field?.isPresent || !field.rawValue) {
      return { status: "not_detected", explanation: "Net quantity not detected — cannot verify unit type.", confidenceScore: 70 };
    }

    const value = (field.normalizedValue ?? field.rawValue).toLowerCase();
    const solidUnits = (evaluation.solid_units as string[]) || [];
    const liquidUnits = (evaluation.liquid_units as string[]) || [];

    const isSolidCategory = ["packaged_food", "other"].includes(category);
    const isLiquidCategory = ["edible_oils", "beverages"].includes(category);

    const hasSolidUnit = solidUnits.some((u) => value.includes(u.toLowerCase()));
    const hasLiquidUnit = liquidUnits.some((u) => value.includes(u.toLowerCase()));

    if (isSolidCategory && hasLiquidUnit && !hasSolidUnit) {
      return {
        status: "potential_non_compliance",
        explanation: `Net quantity "${field.rawValue}" uses liquid unit for what appears to be a solid product. Rule 9 requires weight units for solid commodities.`,
        confidenceScore: 70,
      };
    }
    if (isLiquidCategory && hasSolidUnit && !hasLiquidUnit) {
      return {
        status: "potential_non_compliance",
        explanation: `Net quantity "${field.rawValue}" uses weight unit for what appears to be a liquid product. Rule 9 requires volume units for liquid commodities.`,
        confidenceScore: 70,
      };
    }

    return {
      status: "pass",
      explanation: `Net quantity "${field.rawValue}" uses appropriate unit for this product category.`,
      confidenceScore: field.confidence,
    };
  }

  // -----------------------------------------------------------------------
  private checkPlacement(
    field: ExtractedField | undefined,
    evaluation: Record<string, unknown>
  ): { status: RuleEvaluationResult["status"]; explanation: string; confidenceScore: number } {
    if (!field?.isPresent) {
      return { status: "not_detected", explanation: "Net quantity not detected — cannot assess placement.", confidenceScore: 70 };
    }
    // We can only note this as requiring manual review for placement check
    return {
      status: "requires_review",
      explanation: `Net quantity detected. Placement on principal display panel (lower third) requires physical inspection to verify compliance with Rule 8. AI cannot determine layout compliance from image alone.`,
      confidenceScore: 80,
    };
  }

  // -----------------------------------------------------------------------
  private determineSeverity(
    rule: (typeof rulesData.rules)[0],
    status: RuleEvaluationResult["status"]
  ): RuleEvaluationResult["severity"] {
    if (status === "pass" || status === "not_applicable") return "compliant";
    if (status === "not_determinable" || status === "not_detected") return rule.critical ? "warning" : "advisory";
    if (status === "potential_non_compliance") return rule.critical ? "critical" : "warning";
    return "advisory";
  }

  // -----------------------------------------------------------------------
  private getApplicableRules(category: string): string[] {
    const cat = (this.categories as Record<string, { applicable_rules: string[] }>)[category];
    if (!cat) return this.getApplicableRules("other");
    return cat.applicable_rules;
  }

  // -----------------------------------------------------------------------
  private normalizeCategory(cat: string): string {
    const map: Record<string, string> = {
      "packaged food": "packaged_food",
      "packaged_food": "packaged_food",
      "edible oils": "edible_oils",
      "edible_oils": "edible_oils",
      "cosmetics": "cosmetics",
      "beverages": "beverages",
      "personal care": "personal_care",
      "personal_care": "personal_care",
      "electronics": "electronics",
      "other": "other",
    };
    return map[cat.toLowerCase()] ?? "other";
  }

  // -----------------------------------------------------------------------
  private summarize(
    evaluations: RuleEvaluationResult[]
  ): ComplianceReport["summary"] {
    const passed = evaluations.filter((e) => e.status === "pass").length;
    const potentialNonCompliance = evaluations.filter((e) => e.status === "potential_non_compliance").length;
    const notDetected = evaluations.filter((e) => e.status === "not_detected").length;
    const notDeterminable = evaluations.filter((e) => e.status === "not_determinable").length;
    const notApplicable = evaluations.filter((e) => e.status === "not_applicable").length;
    const requiresReview = evaluations.filter((e) => e.status === "requires_review").length;
    const requiresPhysicalMeasurement = evaluations.filter((e) => e.requiresPhysicalMeasurement).length;

    let overallStatus: ComplianceReport["summary"]["overallStatus"];
    if (potentialNonCompliance > 0) {
      const criticalCount = evaluations.filter(
        (e) => e.status === "potential_non_compliance" && e.severity === "critical"
      ).length;
      overallStatus = criticalCount > 0 ? "non_compliant" : "potential_issues";
    } else if (notDetected > 0 || requiresReview > 0) {
      overallStatus = "requires_investigator_review";
    } else {
      overallStatus = "compliant";
    }

    return {
      totalChecks: evaluations.length,
      passed,
      potentialNonCompliance,
      notDetected,
      notDeterminable,
      notApplicable,
      requiresReview,
      requiresPhysicalMeasurement,
      overallStatus,
    };
  }

  // -----------------------------------------------------------------------
  /** Get all applicable rules metadata for a category (for UI display) */
  getRulesForCategory(category: string): (typeof rulesData.rules)[0][] {
    const normalized = this.normalizeCategory(category);
    const ids = this.getApplicableRules(normalized);
    return ids.map((id) => this.rules.find((r) => r.id === id)!).filter(Boolean);
  }
}

// Singleton instance
export const complianceEngine = new ComplianceEngine();
