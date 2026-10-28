import type { LiftFamily } from "@/domain/domain.types";

import type { StrengthTrendInterpretation } from "../status/progress.strengthTrendInterpretation.types";
import type { WorkoutRepObservations } from "../strength/progress.dailyRepObservations.types";
import type { RepLaneTrend } from "../strength/progress.repLaneTrends.types";

/** Interpretation plus original calculation evidence; no presentation descriptors. */
export type LiftStrengthTrendAnalysis = StrengthTrendInterpretation & {
  // Only the latest segment; empty observations distinguish logged but unusable history.
  history: readonly WorkoutRepObservations[];
  gapReset: boolean;
  // Original Step 3 results for the selected comparable window, including unavailable lanes.
  // Empty for fallback and Building History selections; stale comparable evidence is retained.
  repLaneTrends: readonly RepLaneTrend[];
};

export type StrengthTrendAnalysis = {
  analysisTime: number;
  lifts: Record<LiftFamily, LiftStrengthTrendAnalysis>;
};
