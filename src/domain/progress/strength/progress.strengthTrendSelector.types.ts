import type { LiftFamily } from "@/domain/domain.types";

import type { WorkoutRepObservations } from "./progress.dailyRepObservations.types";
import type { FallbackStrengthTrend } from "./progress.fallbackStrength.types";
import type { OverallRepTrend } from "./progress.overallRepTrends.types";
import type {
  RepLaneWindow,
  RepLaneWindowMode,
} from "./progress.repLaneTrends.types";

/** Candidates calculated by Steps 4–5 using this exact window and history segment. */
export type StrengthTrendWindowCandidates = {
  window: RepLaneWindow;
  comparable?: OverallRepTrend;
  adjustedFallback?: FallbackStrengthTrend;
  rawFallback?: FallbackStrengthTrend;
};

export type StrengthTrendCandidates = {
  family: LiftFamily;
  // Validated Step 1 output restricted to the caller's selected training-history segment.
  history: readonly WorkoutRepObservations[];
  early: StrengthTrendWindowCandidates;
  established: StrengthTrendWindowCandidates;
};

/** Original calculation and intrinsic cap; window mode permits future window-based capping. */
export type SelectedStrengthTrend =
  | {
      method: "comparable";
      family: LiftFamily;
      windowMode: RepLaneWindowMode;
      window: RepLaneWindow;
      trend: OverallRepTrend;
    }
  | {
      method: "rpe_adjusted_fallback";
      family: LiftFamily;
      windowMode: RepLaneWindowMode;
      window: RepLaneWindow;
      trend: FallbackStrengthTrend;
    }
  | {
      method: "raw_brzycki_fallback";
      family: LiftFamily;
      windowMode: RepLaneWindowMode;
      window: RepLaneWindow;
      trend: FallbackStrengthTrend;
    }
  | {
      method: "building_history";
      family: LiftFamily;
    };
