import type { LiftFamily } from "@/domain/domain.types";

import type { LiftDiagnosis } from "../diagnosis/progress.diagnosis.types";
import type {
  EvidenceAssessment,
  EvidenceFact,
} from "../evidence/progress.evidence.types";
import type { Measurement } from "../measurements/progress.measurements.types";
import type { LiftRecommendation } from "../recommendation/progress.recommendation.types";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import type { StatusAssessment } from "../status/progress.status.types";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";

/**
 * The measured facts and conclusions for one lift before a recommendation
 * is attached. Benchmark generation consumes this result, keeping its inputs
 * independent of the recommendation it helps produce.
 */
export type LiftAnalysisCore = {
  family: LiftFamily; // Competition lift being analyzed: Squat, Bench, or Deadlift.
  analysisTime: number; // Reference time in milliseconds used for history bounds and recency.
  sessions: readonly LiftSessionMetrics[]; // Workout summaries for this lift within the loaded history.
  status: StatusAssessment; // Selected performance label and whether it is confirmed.
  evidence: EvidenceAssessment; // How well the recorded history supports that status.
  diagnosis: LiftDiagnosis; // Possible explanation for the pattern, not a measured cause.
  trends: LiftTrendMetrics; // Changes over time and the daily and weekly data behind them.
  currentEstimatedMax: Measurement; // Median raw estimate from the latest three context days, or fewer if available, in kg.
  analyzedSessionCount: number; // Number of performance-bearing workouts in the selected eight-week context.
  facts: readonly EvidenceFact[]; // Measured changes with dates and source workout IDs for explanations.
};

/**
 * The complete analysis of one competition lift, including its next action.
 * The view model uses this coherent result to populate all four cards.
 */
export type LiftAnalysis = LiftAnalysisCore & {
  recommendation: LiftRecommendation; // Next Action decision, with an optional supported benchmark.
};

/**
 * All three lift analyses evaluated at one reference time. One refresh
 * produces this snapshot, so switching lifts can reuse it without another
 * history read or analytical calculation.
 */
export type ProgressOverview = {
  analysisTime: number; // Shared reference timestamp in milliseconds for all three analyses.
  lifts: Record<LiftFamily, LiftAnalysis>; // Complete analysis for each family; switching lifts reuses these results.
};
