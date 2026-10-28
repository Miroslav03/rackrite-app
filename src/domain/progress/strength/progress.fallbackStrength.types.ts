import type { LiftFamily } from "@/domain/domain.types";

import type { EvidenceLevel } from "../evidence/progress.evidence.types";
import type { Measurement } from "../measurements/progress.measurements.types";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

export type FallbackStrengthBasis = "rpe_adjusted" | "raw_brzycki";

/** One competition lift's estimated strength per local day, across all eligible reps. */
export type DailyFallbackStrengthObservation = {
  family: LiftFamily;
  day: number; // Local calendar-day number, not a millisecond timestamp.
  rawE1rm: number; // Median of the workouts' best raw estimates, in kg.
  adjustedE1rm: number | null; // Independent median of available adjusted estimates.
  workoutCount: number; // Distinct workouts with a valid raw representative.
  adjustedWorkoutCount: number; // Those workouts that also have a valid adjusted representative.
  rawSources: readonly RepresentativeSet[];
  adjustedSources: readonly RepresentativeSet[];
};

/** Counts and coverage survive even when this half cannot support a comparison. */
export type FallbackStrengthPeriod = {
  observationCount: number; // Distinct days with a valid value for the requested basis.
  workoutCount: number;
  adjustedWorkoutCount: number;
  rpeCoverage: number; // Adjusted workouts / eligible raw workouts; zero with no workouts.
  median: number | null; // Requested-basis median in kg; null when no valid values exist.
};

/** A candidate for one explicitly requested method; no method selection or evidence grading. */
export type FallbackStrengthTrend = {
  family: LiftFamily;
  basis: FallbackStrengthBasis;
  change: Measurement; // Unrounded percentage change, or an explicit unavailable reason.
  earlier: FallbackStrengthPeriod;
  recent: FallbackStrengthPeriod;
  evidenceCap: Extract<EvidenceLevel, "moderate"> | null;
};
