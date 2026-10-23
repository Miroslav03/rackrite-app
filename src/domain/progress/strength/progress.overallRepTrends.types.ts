import type { LiftFamily } from "@/domain/domain.types";

import type { EvidenceLevel } from "../evidence/progress.evidence.types";
import type { Measurement } from "../measurements/progress.measurements.types";

import type { RepLaneTrend } from "./progress.repLaneTrends.types";

/**
 * How closely the usable rep-group percentage changes agree for one lift.
 * Default meaningful changes are gains of at least 2% or losses of at least 3%.
 * The direction with more meaningful changes leads; a change of more than 1%
 * against that direction counts as opposition. Cutoffs below are config defaults.
 * Spread means the largest change minus the smallest, in percentage points.
 * Major conflict and meaningful disagreement take priority over uneven results.
 */
export type RepLaneAgreement =
  /** Only one rep group qualifies, so there are no other groups to compare it with. */
  | "single_lane"
  /**
   * Multiple groups qualify, with no opposition and a spread of at most 10
   * percentage points. Small mixed changes can agree too, e.g. +0.5% and -0.5%.
   */
  | "consistent"
  /**
   * An opposing change is more than 1% but less than 3%, and the spread is at
   * most 10 percentage points. Example: +4%, +3%, -2%.
   */
  | "minor_disagreement"
  /**
   * An opposing change is at least 3% but less than 5%, without a major conflict.
   * Example: +4%, +3%, -4%.
   */
  | "meaningful_disagreement"
  /**
   * Equal nonzero counts of meaningful gains and drops, or an opposing change
   * of at least 5%. Examples: +4%, -4% or +5%, +4%, -8%.
   */
  | "major_conflict"
  /**
   * The largest and smallest changes are more than 10 percentage points apart,
   * without a major conflict or meaningful disagreement. Example: +2%, +30%.
   */
  | "uneven"
  /** No rep group has a usable Step 3 change, so the overall change is unavailable. */
  | "insufficient";

/** A summary of comparable training performance, not an exact change in true 1RM. */
export type OverallRepTrend = {
  family: LiftFamily;
  change: Measurement; // Unrounded median of qualifying rep-lane percentage changes.
  contributingReps: readonly number[]; // Qualifying exact rep counts, sorted ascending.
  agreement: RepLaneAgreement;
  measurementBasis: RepLaneTrend["basis"] | "mixed";
  evidenceCap: Exclude<EvidenceLevel, "weak"> | null; // A ceiling for future grading; null when no lane qualifies.
};
