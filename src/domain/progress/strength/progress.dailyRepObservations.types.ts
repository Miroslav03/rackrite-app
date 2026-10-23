import type { LiftFamily } from "@/domain/domain.types";

import type {
  LiftSessionMetrics,
  RepresentativeSet,
} from "../sessions/progress.sessions.types";

import type { WorkoutRepObservation } from "./progress.strength.types";

/** Step 1 observations paired with their validated workout and lift context. */
export type WorkoutRepObservations = Pick<
  LiftSessionMetrics,
  "workoutId" | "family" | "finishedAt"
> & {
  observations: readonly WorkoutRepObservation[];
};

/** Separate load and adjusted e1RM medians for one lift, local day and exact reps. */
export type DailyRepObservation = {
  family: LiftFamily;
  day: number; // Local calendar-day number, not a millisecond timestamp.
  reps: number;
  rawKg: number; // Median actual load of the selected raw sets, in kg.
  adjustedE1rm: number | null; // Median valid stored adjusted estimates, in kg; null when none qualify.
  workoutCount: number; // Distinct workouts contributing this exact rep count.
  adjustedWorkoutCount: number; // Contributing workouts with an eligible adjusted representative.
  rawSources: readonly RepresentativeSet[]; // Original raw representatives, ordered by workout completion then stable IDs.
  adjustedSources: readonly RepresentativeSet[]; // Original adjusted representatives, independently ordered by the same convention.
};
