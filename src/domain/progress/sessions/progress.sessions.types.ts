import type { LiftFamily } from "@/domain/domain.types";
import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/domain/workout/workout.types";

import type { CompetitionLiftExposure } from "../history/progress.history.types";

/**
 * A problem with recorded data that can limit analysis, such as conflicting
 * set IDs or invalid values. These describe data quality, not training quality.
 */
export type QualityIssue =
  | "invalid_workout"
  | "invalid_set"
  | "invalid_rpe"
  | "conflicting_duplicate"
  | "invalid_ownership"
  | "ambiguous_identity";

/**
 * One eligible logged set with its raw and optional effort-adjusted estimates.
 * It can represent a session without losing the weight, reps, RPE, or source
 * IDs needed to explain the result and choose a benchmark.
 */
export type RepresentativeSet = {
  workoutId: Workout["id"]; // Source workout ID, so the estimate can be traced back.
  workoutExerciseId: WorkoutExercise["id"]; // Source exercise-entry ID within that workout.
  setId: WorkoutSet["id"]; // Original set ID used for traceability and deterministic selection.

  finishedAt: number; // Set completion timestamp in milliseconds.
  workoutFinishedAt: number; // Workout completion timestamp used for exposure dates and recency.

  weight: number; // Recorded total load in kilograms.
  reps: number; // Recorded number of completed repetitions.
  rpe: number | null; // Valid recorded whole-number effort rating; null if missing or invalid.

  // Calucalted 1RM (Brzycki formula) with reps and weight
  rawEstimate: number;
  /*  We set adjustedRepresentative when at least one set:
    1. Passes the normal performance eligibility checks.
    2. Has a valid recorded RPE of 7–10.
    3. Has effective reps ≤ 10: reps + (10 − RPE).
    4. Has a raw estimate at least 95% of the workout’s best raw estimate. */
  adjustedEstimate: number | null;
};

/**
 * The summary of one competition lift in one workout. It holds the best raw
 * and adjusted representatives plus totals across eligible sets, so trends
 * can compare sessions without processing every original set again.
 */
export type LiftSessionMetrics = {
  workoutId: Workout["id"]; // Workout summarized by this object.
  family: LiftFamily; // The one competition lift family summarized in this workout.
  finishedAt: number; // Workout completion timestamp in milliseconds, used to group days and weeks.

  // The best set based on weight and reps
  rawRepresentative: RepresentativeSet | null;
  // The best qualifying set after considering RPE
  adjustedRepresentative: RepresentativeSet | null;

  volume: number; // Sum of weight times reps across valid completed non-warmup sets, in kg.

  validSetCount: number; // Sets accepted for volume; some may be ineligible for strength estimates.
  completedSetCount: number; // Unique completed non-warmup sets examined, including rejected records.
  invalidSetCount: number; // Examined sets rejected for invalid data, ownership, or conflicting identities.

  rpeSetCount: number; // Valid training sets with a valid recorded RPE, used to measure coverage.
  highEffortSetCount: number; // Valid training sets at RPE 9–10 under the default configuration.
  typicalRpe: number | null; // Median valid recorded set RPE; null when none is available.

  issues: QualityIssue[]; // Data-quality problems found while building this session summary.
};

/**
 * One exercise entry from the history projection. Reusing that shape keeps
 * session helpers aligned with the input instead of defining it twice.
 */
type Entry = CompetitionLiftExposure["entries"][number];

/**
 * One recorded set from a history entry, before analytical validation.
 * Session helpers use this shared input shape when checking eligibility.
 */
export type SetRecord = Entry["sets"][number];

/**
 * A recorded set bundled with its exercise entry and workout. This context
 * is needed to check ownership, completion chronology, and deterministic order.
 */
export type SourceSet = {
  set: SetRecord; // Original set whose eligibility is being checked.
  entry: Entry["exercise"]; // Owning exercise entry, used to check links and ordering.
  workout: CompetitionLiftExposure["workout"]; // Owning workout, used to check completion chronology and identity.
};
