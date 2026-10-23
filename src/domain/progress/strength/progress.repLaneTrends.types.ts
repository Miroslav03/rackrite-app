import type { LiftFamily } from "@/domain/domain.types";

import type { Measurement } from "../measurements/progress.measurements.types";

/** Chronological local-midnight timestamps in ms; both halves exclude their end. */
export type RepLaneWindow = {
  earlierStartsAt: number;
  recentStartsAt: number;
  endExclusive: number;
};

export type RepLaneWindowMode = "early" | "established";

/** Daily sample counts and workout-weighted coverage for one comparison half. */
export type RepLanePeriod = {
  observationCount: number; // Distinct daily observations in this lift/rep lane.
  adjustedObservationCount: number; // Daily observations with a valid adjusted e1RM.
  workoutCount: number; // Contributing workouts across this period's daily observations.
  adjustedWorkoutCount: number; // Contributing workouts with eligible adjusted representatives.
  rpeCoverage: number; // adjustedWorkoutCount / workoutCount; zero when no workouts contribute.
  median: number | null; // Selected-basis value in kg; null with insufficient history or no finite values.
};

/** One exact rep lane's comparison; no overall lift change or training status. */
export type RepLaneTrend = {
  family: LiftFamily;
  reps: number;
  basis: "rpe_adjusted" | "raw_load" | "insufficient";
  earlier: RepLanePeriod;
  recent: RepLanePeriod;
  change: Measurement; // Unrounded percentage change, or an explicit unavailable reason.
};
