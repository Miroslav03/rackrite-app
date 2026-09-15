import type { Exercise } from "@/domain/exercises/exercise.types";
import type {
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/domain/workout/workout.types";

/**
 * The completion-time bounds for one history read. They keep the repository
 * focused on the period being analyzed instead of loading every saved workout.
 */
export type CompetitionLiftHistoryRequest = {
  fromFinishedAt: number; // Earliest included workout completion timestamp, in milliseconds.
  throughFinishedAt: number; // Latest included workout completion timestamp, in milliseconds.
};

/**
 * The recorded workout, competition exercise, and sets needed for analysis.
 * This is the input before analytical eligibility checks; keeping source IDs
 * lets session derivation detect duplicates and trace results to logged sets.
 */
export type CompetitionLiftExposure = {
  workout: Pick<Workout, "id" | "status" | "startedAt" | "finishedAt">; // Source workout identity and timestamps for completion checks.
  exercise: Pick<Exercise, "id" | "kind" | "origin" | "liftFamily">; // Exercise definition used to verify competition identity and family.
  // Recorded entries of this exercise within the workout.
  entries: readonly {
    // Exercise entry IDs and order used to validate ownership and resolve ties.
    exercise: Pick<
      WorkoutExercise,
      "id" | "workoutId" | "exerciseId" | "orderIndex"
    >;
    // Original analytical set fields, still awaiting eligibility checks.
    sets: readonly Pick<
      WorkoutSet,
      | "id"
      | "workoutExerciseId"
      | "setIndex"
      | "type"
      | "weight"
      | "reps"
      | "rpe"
      | "finishedAt"
    >[];
  }[];
};

/**
 * The history-reading contract required by Progress. It lets the domain work
 * with plain history data while SQLite access stays in the persistence layer.
 */
export type ProgressRepository = {
  // Reads bounded completed competition history for all three lift families together.
  getCompletedCompetitionLiftHistory: (
    request: CompetitionLiftHistoryRequest,
  ) => Promise<CompetitionLiftExposure[]>;
};
