import type { LiftAnalysisCore } from "../analysis/progress.analysis.types";
import { median } from "../measurements/progress.measurements.utils";
import { estimateLoadForEffort } from "../performance/progress.performance";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { RecommendationKind } from "../recommendation/progress.recommendation.types";
import type { RepresentativeSet } from "../sessions/progress.sessions.types";

import type {
  BenchmarkDecision,
  BenchmarkTarget,
} from "./progress.benchmark.types";
import {
  roundLoadDown,
  selectBenchmarkReferences,
} from "./progress.benchmark.utils";

export function generateBenchmarkTarget(
  analysis: LiftAnalysisCore,
  recommendation: RecommendationKind,
  config: ProgressConfig = progressConfig,
): BenchmarkDecision {
  if (analysis.status.reason === "stale_history")
    return { status: "unavailable", reason: "stale_history" };
  if (analysis.trends.conflictingSignals)
    return { status: "unavailable", reason: "conflicting_signals" };
  if (analysis.status.value === "learning")
    return { status: "unavailable", reason: "learning" };
  if (analysis.evidence.level === "weak")
    return { status: "unavailable", reason: "weak_evidence" };
  if (analysis.diagnosis.kind === "inconsistent_training")
    return { status: "unavailable", reason: "training_gaps" };

  const references = selectBenchmarkReferences(analysis, config);

  if (references === null)
    return { status: "unavailable", reason: "comparable_exposures" };

  const { reps, sources, reference } = references;

  const performance = (set: RepresentativeSet) =>
    analysis.trends.basis === "effort_adjusted" ||
    analysis.trends.basis === "matched_reps_rpe"
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
    return { status: "unavailable", reason: "outlier" };

  const adjusted = sources
    .map((set) => set.adjustedEstimate)
    .filter((value): value is number => value !== null);

  const capacity = adjusted.length === sources.length ? median(adjusted) : null;

  const effortKnown =
    capacity !== null && sources.every((set) => set.rpe !== null);

  const targetRpe = effortKnown
    ? { min: config.benchmarkMinimumRpe, max: config.benchmarkMaximumRpe }
    : null;

  function target(
    intent: BenchmarkTarget["intent"],
    weight: number,
    reason: BenchmarkTarget["reason"],
  ): BenchmarkDecision {
    return {
      status: "available",
      target: {
        reps,
        sources,
        rpe: targetRpe,
        intent,
        weight,
        reason,
        referenceWeight: reference.weight,
        loadChange: weight - reference.weight,
        evidence: analysis.evidence.level,
        basis: analysis.trends.basis,
      },
    };
  }

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
      return { status: "unavailable", reason: "effort_capacity" };

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
      return { status: "unavailable", reason: "rounding_limits" };

    return target(
      "reduce_stress",
      weight,
      analysis.status.value === "regressing"
        ? "repeated_decline"
        : recommendation === "reduce_stress"
          ? "lower_stress"
          : "high_effort_reference",
    );
  }

  if (
    analysis.status.value === "progressing" &&
    recommendation === "continue_approach" &&
    !(
      analysis.trends.effort.basis === "matched" &&
      analysis.trends.effort.change.status === "available" &&
      analysis.trends.effort.change.value > 0
    ) &&
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
        return target("progress", weight, "supported_progression");
    }
  }

  return target(
    "repeat",
    reference.weight,
    effortKnown ? "comparable_repeat" : "effort_headroom_unknown",
  );
}
