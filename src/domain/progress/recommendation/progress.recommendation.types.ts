import type { BenchmarkTarget } from "../benchmark/progress.benchmark.types";
import type { DiagnosisReason } from "../diagnosis/progress.diagnosis.types";
import type { StatusReason } from "../status/progress.status.types";

/**
 * The possible next-action categories, such as maintaining or reducing
 * stress. This finite set lets pure rules choose an action while the view
 * model supplies its wording.
 */
export type RecommendationKind =
  | "continue_approach"
  | "monitor"
  | "reduce_stress"
  | "review_stimulus"
  | "restore_consistency"
  | "gather_evidence"
  | "reassess";

/**
 * The suggested action with its reasons and an optional benchmark. It is
 * the domain result behind the Next Action card; a missing benchmark means
 * there is no sufficiently supported specific target.
 */
export type LiftRecommendation = {
  kind: RecommendationKind; // Action category that the Next Action card translates into advice.
  reasons: readonly (StatusReason | DiagnosisReason)[]; // Status and diagnosis codes explaining the suggested action.
  benchmark: BenchmarkTarget | null; // Optional weight-and-reps suggestion; null means no defensible target.
};
