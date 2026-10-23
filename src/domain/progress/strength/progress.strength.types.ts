import type { RepresentativeSet } from "../sessions/progress.sessions.types";
import type { Measurement } from "../measurements/progress.measurements.types";
import type {
  PerformanceBasis,
  TrendComparison,
} from "../trends/progress.trends.types";

/**
 * Best raw and effort-adjusted performances for one exact rep count in one
 * workout. Both representatives retain their original eligible source sets.
 */
export type WorkoutRepObservation = {
  reps: number; // Exact performed repetition count, from 1 through 10.
  rawRepresentative: RepresentativeSet; // Highest actual load within this rep group.
  adjustedRepresentative: RepresentativeSet | null; // Highest valid stored adjusted estimate; null when none qualifies.
  eligibleSetCount: number; // Eligible strength sets in this rep group, including unknown RPE.
  adjustedEligibleSetCount: number; // Sets with a valid adjusted estimate in this rep group.
};

/**
 * One local day's observation for strength evidence or internal effort
 * comparisons. The containing comparison determines the value's units.
 */
export type StrengthDay = {
  day: number; // Local calendar-day number for grouping and gap checks; not a millisecond timestamp.
  finishedAt: number; // Workout completion timestamp used for comparison windows, in milliseconds.
  value: number | null; // Baseline-100 strength or daily median RPE; null when unavailable.
  sources: readonly RepresentativeSet[]; // Retained source sets; empty when none are retained.
};

/**
 * A qualifying group of sets with the same reps and, when used, RPE band.
 * Compares earlier and recent median loads using one selected set per day.
 */
export type ComparableBucket = {
  key: string; // Matching identity: reps alone ("3") or reps plus RPE band ("3:7-8").
  reps: number; // Exact repetition count shared by every set in this group.
  baseline: number; // Median selected daily load in the earlier comparison half, in kg.
  recent: number; // Median selected daily load in the recent comparison half, in kg.
  change: number; // Percentage load change: (recent / baseline - 1) × 100.
  weight: number; // Influence in the weighted median: the smaller of the two day counts, not a load in kg.
  baselineDays: number; // Distinct days contributing a selected set in the earlier half.
  recentDays: number; // Distinct days contributing a selected set in the recent half.
  sources: readonly RepresentativeSet[]; // Selected sets across both halves, one per day, ordered from oldest to newest.
};

/**
 * The selected strength signal: direct matched loads or a formula fallback.
 * Unlike raw/adjusted TrendComparison estimates in kg, an available baseline
 * is normalized to 100 and recent is 100 + percentage change. Unavailable
 * values remain null; change retains its percentage unit and availability.
 */
export type StrengthComparison = TrendComparison & {
  basis: PerformanceBasis; // Which direct comparison or formula estimate supplies the strength signal.
  cohortKey: string; // Basis plus selected bucket keys; changes reset status confirmation. Formula fallbacks use the basis alone.
  buckets: readonly ComparableBucket[]; // Qualifying groups used for direct comparison; empty when using a formula fallback.
  daily: readonly StrengthDay[]; // Analysis-context history expressed against the selected baseline of 100; unmatched days have null values.
  baselineCoverage: number; // Share of earlier raw-performance days covered by the selected signal, from 0 to 1.
  recentCoverage: number; // Share of recent raw-performance days covered by the selected signal, from 0 to 1.
};

/**
 * How recorded effort changed: compare identical loads and reps when possible,
 * otherwise use typical recorded effort without claiming the work was matched.
 */
export type EffortComparison = {
  basis: "matched" | "typical"; // Same-load/same-rep comparison, or the overall recorded-effort fallback.
  change: Measurement; // Recent minus earlier effort in RPE points; negative means easier, or unavailable with a reason.
  sources: readonly RepresentativeSet[]; // Sets from qualifying matched cohorts, ordered by local day; empty for typical-effort fallback.
};
