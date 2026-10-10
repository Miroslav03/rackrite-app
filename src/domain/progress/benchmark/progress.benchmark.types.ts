import type { EvidenceLevel } from "../evidence/progress.evidence.types";
import type { PerformanceBasis } from "../trends/progress.trends.types";

import type { RepresentativeSet } from "../sessions/progress.sessions.types";

/**
 * A suggested weight and rep target for a comparable exposure, with an
 * optional RPE range, intent, and supporting sets. It explains a conservative
 * next target without creating or changing a workout.
 */
export type BenchmarkTarget = {
  intent: "progress" | "repeat" | "reduce_stress"; // Whether to increase the load, repeat it, or reduce training stress.
  referenceWeight: number; // Weight of the latest supporting set, in kg; the target is compared with this load.
  loadChange: number; // Target weight minus reference weight, in kg; positive means heavier, negative means lighter.
  evidence: EvidenceLevel; // How well the recorded history supports the lift's status when this target is offered.
  basis: PerformanceBasis; // How strength was compared: matching sets, or estimates from weight, reps and possibly RPE.
  weight: number; // Suggested total load in kilograms.
  reps: number; // Familiar repetition count to perform at the suggested load.
  // Optional effort range; null means no numeric RPE target is supported.
  rpe: {
    min: number; // Lower end of the suggested whole-number RPE range.
    max: number; // Upper end of the suggested whole-number RPE range.
  } | null;
  sources: readonly RepresentativeSet[]; // Recent representative sets supporting the suggested target.
  // Explanation code describing why this target was chosen.
  reason:
    | "supported_progression"
    | "comparable_repeat"
    | "effort_headroom_unknown"
    | "lower_stress"
    | "repeated_decline"
    | "high_effort_reference";
};

/**
 * The qualifying recent sets at a familiar rep count and the latest set
 * used as the load reference. Benchmark generation needs these together
 * to check capacity and constrain any proposed load change.
 */
export type BenchmarkReferences = {
  reps: number; // Shared familiar repetition count selected from recent training.
  sources: RepresentativeSet[]; // Comparable representative sets from distinct recent days.
  reference: RepresentativeSet; // Latest qualifying set; its load anchors any increase or reduction.
};

/**
 * Why the app cannot offer a specific weight-and-reps target yet.
 * The screen uses this reason to explain what is missing or uncertain.
 */
export type BenchmarkUnavailableReason =
  | "learning" // More training history is needed before choosing a target.
  | "weak_evidence" // The current performance pattern is not supported well enough.
  | "training_gaps" // Irregular training makes a target difficult to support.
  | "stale_history" // The last usable performance is too old.
  | "conflicting_signals" // Weight-and-reps estimates and effort-adjusted estimates disagree.
  | "comparable_exposures" // Not enough recent training days have sets at a suitable shared rep count.
  | "outlier" // The latest selected set differs too much from the other supporting estimates.
  | "effort_capacity" // Recorded effort cannot support the proposed reduction in load.
  | "rounding_limits"; // Rounding to available weight increments would exceed the allowed load limits.

/**
 * The result of trying to choose a benchmark: a supported target,
 * or the reason no target can be shown. Check status before reading either.
 */
export type BenchmarkDecision =
  | {
      status: "available"; // A specific target passed the benchmark checks.
      target: BenchmarkTarget // Suggested weight, reps and optional RPE, with supporting sets.
    }
  | {
      status: "unavailable"; // A specific target cannot currently be supported.
      reason: BenchmarkUnavailableReason // What prevented the app from offering a target.
    };
