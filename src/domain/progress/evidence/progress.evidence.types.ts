import type { Workout } from "@/domain/workout/workout.types";

import type {
  AnalysisWindow,
  Measurement,
} from "../measurements/progress.measurements.types";

/**
 * How much the recorded data supports a conclusion. These qualitative
 * levels communicate strength of evidence without inventing a probability.
 */
export type EvidenceLevel = "weak" | "moderate" | "strong";

/**
 * The evidence level for a performance status, including supporting day
 * counts and limitations. Recommendations use it to stay conservative when
 * the history is sparse, inconsistent, or difficult to compare.
 */
export type EvidenceAssessment = {
  level: EvidenceLevel; // Strength of support for the status, not a probability.
  supportingDays: number; // Recent days meeting the support rule for the selected status.
  consideredDays: number; // Number of recent performance days checked for support, at most five by default.
  // Codes explaining supporting patterns or limitations in the data.
  reasons: readonly (
    | "limited_history"
    | "invalid_records"
    | "repetition_shift"
    | "consistent_pattern"
    | "conflicting_signals"
  )[];
};

/**
 * A measured change linked to its comparison period and source workouts.
 * It makes an explanation traceable to recorded training rather than just
 * presenting an unsupported status label.
 */
export type EvidenceFact = {
  metric: "performance" | "e1rm" | "rpe" | "volume" | "frequency"; // Which measurement this fact describes.
  change: Measurement; // Measured change, or why it is unavailable; RPE uses points, others use percent.
  window: AnalysisWindow; // Comparison dates that this measured change describes.
  workoutIds: readonly Workout["id"][]; // Source workouts used to trace the fact back to recorded history.
};
