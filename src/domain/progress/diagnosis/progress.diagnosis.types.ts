import type { EvidenceLevel } from "../evidence/progress.evidence.types";
import type { AnalysisWindow } from "../measurements/progress.measurements.types";

/**
 * The possible primary explanations for a training pattern, including no
 * concern and insufficient evidence. These are hypotheses, not measurements
 * of a physiological cause.
 */
export type DiagnosisKind =
  | "none"
  | "fatigue"
  | "insufficient_stimulus"
  | "excessive_intensity"
  | "inconsistent_training"
  | "insufficient_evidence";

/**
 * The observations supporting an explanation, such as rising effort or
 * training gaps. They let recommendations and presentation explain why
 * a hypothesis was chosen without embedding user-facing wording here.
 */
export type DiagnosisReason =
  | "rising_effort"
  | "rising_volume"
  | "rising_frequency"
  | "frequent_high_effort"
  | "training_gaps"
  | "lower_historical_workload"
  | "lower_historical_frequency"
  | "uncertain_cause"
  | "productive_training";

/**
 * The primary explanation, its evidence level, supporting reasons, and
 * optional historical reference period. Keeping it separate from status
 * distinguishes what performance did from what might explain it.
 */
export type LiftDiagnosis = {
  kind: DiagnosisKind; // Primary hypothesis, or an indication that no cause is established.
  evidence: EvidenceLevel; // Support for this explanation, separate from status evidence.
  reasons: readonly DiagnosisReason[]; // Observed patterns supporting the selected explanation.
  referenceWindow: AnalysisWindow | null; // Period supporting the explanation; null when no period is attached.
};
