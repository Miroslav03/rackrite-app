import type { LiftAnalysisCore } from "../analysis/progress.analysis.types";
import { median } from "../measurements/progress.measurements.utils";
import { estimateLoadForEffort } from "../performance/progress.performance";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { RecommendationKind } from "../recommendation/progress.recommendation.types";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

import type { BenchmarkTarget } from "./progress.benchmark.types";
import {
  roundLoadDown,
  selectBenchmarkReferences,
} from "./progress.benchmark.utils";

export function generateBenchmarkTarget(
  analysis: LiftAnalysisCore,
  recommendation: RecommendationKind,
  config: ProgressConfig = progressConfig,
): BenchmarkTarget | null {
  if (
    analysis.status.value === "learning" ||
    analysis.evidence.level === "weak" ||
    analysis.diagnosis.kind === "inconsistent_training" ||
    analysis.trends.conflictingSignals
  )
    return null;

  const references = selectBenchmarkReferences(analysis, config);
  if (references === null) return null;

  const { reps, sources, reference } = references;

  const performance = (set: RepresentativeSet) =>
    analysis.trends.basis === "effort_adjusted"
      ? set.adjustedEstimate
      : set.rawEstimate;

  const values = sources
    .map(performance)
    .filter((value): value is number => value !== null);

  const typical = median(values);
  const latest = performance(reference);

  if (
    typical === null ||
    latest === null ||
    Math.abs(latest / typical - 1) * 100 > config.benchmarkOutlierPercent
  )
    return null;

  const adjusted = sources
    .map((set) => set.adjustedEstimate)
    .filter((value): value is number => value !== null);

  const capacity = adjusted.length === sources.length ? median(adjusted) : null;

  const effortKnown =
    capacity !== null && sources.every((set) => set.rpe !== null);

  const targetRpe = effortKnown
    ? { min: config.benchmarkMinimumRpe, max: config.benchmarkMaximumRpe }
    : null;

  const base = { reps, sources, rpe: targetRpe };

  if (
    analysis.status.value === "regressing" ||
    recommendation === "reduce_stress" ||
    (reference.rpe !== null && reference.rpe > config.benchmarkMaximumRpe)
  ) {
    const effortLimit =
      capacity === null
        ? null
        : estimateLoadForEffort(
            capacity,
            reps,
            config.benchmarkMinimumRpe,
            config,
          );

    // Partial effort observations cannot establish a formula-supported reduced target.
    if (sources.some((set) => set.rpe !== null) && effortLimit === null)
      return null;

    const ceiling = Math.min(
      reference.weight * (1 - config.benchmarkReductionFraction),
      effortLimit ?? Infinity,
    );

    const weight = roundLoadDown(ceiling, config.weightIncrement);

    if (
      weight === null ||
      weight <
        reference.weight * (1 - config.benchmarkMaximumReductionFraction) - 1e-8
    )
      return null;

    return { ...base, intent: "reduce_stress", weight, reason: "lower_stress" };
  }

  if (
    analysis.status.value === "progressing" &&
    recommendation === "continue_approach" &&
    effortKnown &&
    capacity !== null &&
    reference.rpe !== null &&
    reference.rpe <= config.benchmarkMinimumRpe
  ) {
    const effortLimit = estimateLoadForEffort(
      capacity,
      reps,
      config.benchmarkMaximumRpe,
      config,
    );

    if (effortLimit !== null) {
      const ceiling = Math.min(
        reference.weight + config.weightIncrement,
        reference.weight * (1 + config.benchmarkIncreaseFraction),
        effortLimit,
      );
      const weight = roundLoadDown(ceiling, config.weightIncrement);

      if (
        weight !== null &&
        weight > reference.weight &&
        weight - reference.weight <= config.weightIncrement + 1e-8
      )
        return {
          ...base,
          intent: "progress",
          weight,
          reason: "supported_progression",
        };
    }
  }

  return {
    ...base,
    intent: "repeat",
    weight: reference.weight,
    reason: effortKnown ? "comparable_repeat" : "effort_headroom_unknown",
  };
}
