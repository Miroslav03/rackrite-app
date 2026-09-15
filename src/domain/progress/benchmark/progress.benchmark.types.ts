import type { RepresentativeSet } from "../sessions/progress.sessions.types";

/**
 * A suggested weight and rep target for a comparable exposure, with an
 * optional RPE range, intent, and supporting sets. It explains a conservative
 * next target without creating or changing a workout.
 */
export type BenchmarkTarget = {
  intent: "progress" | "repeat" | "reduce_stress"; // Whether to increase the load, repeat it, or reduce training stress.
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
    | "lower_stress";
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
