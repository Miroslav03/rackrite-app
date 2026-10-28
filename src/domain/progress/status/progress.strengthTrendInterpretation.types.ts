import type { LiftFamily } from "@/domain/domain.types";

import type { UnavailableReason } from "../measurements/progress.measurements.types";
import type { WorkoutRepObservations } from "../strength/progress.dailyRepObservations.types";
import type { SelectedStrengthTrend } from "../strength/progress.strengthTrendSelector.types";

export type StrengthTrendStatus =
  "building_history" | "progressing" | "maintaining" | "regressing" | "unclear";

export type StrengthTrendReason =
  | UnavailableReason
  | "stale_history"
  | "training_gap"
  | "measured_improvement"
  | "measured_maintenance"
  | "measured_decline"
  | "major_conflict"
  | "uneven_performance";

export type StrengthTrendInterpretationInput = {
  selected: SelectedStrengthTrend;
  analysisTime: number;
  // Validated Step 1 observations from the same history segment used by Step 6.
  history: readonly WorkoutRepObservations[];
  historyContext?: {
    hadTrainingGap?: boolean;
  };
};

export type StrengthTrendInterpretation = {
  family: LiftFamily;
  status: StrengthTrendStatus;
  reason: StrengthTrendReason;
  // With stale_history, this selection is historical context, never a current conclusion.
  selected: SelectedStrengthTrend;
};
