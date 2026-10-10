import type { LiftFamily } from "@/domain/domain.types";
import type { LiftAnalysis } from "@/domain/progress/analysis/progress.analysis.types";
import type { Measurement } from "@/domain/progress/measurements/progress.measurements.types";
import { progressConfig } from "@/domain/progress/progress.config";
import type { RepresentativeSet } from "@/domain/progress/sessions/progress.sessions.types";
import { selectComparisonHistory } from "@/domain/progress/trends/progress.trends.utils";

import type {
  AlgorithmScenario,
  AlgorithmCheckpoint,
} from "./algorithmScenario.fixtures";

export function formatAlgorithmMeasurement(
  value: Measurement,
  unit: string,
): string {
  return value.status === "available"
    ? `${value.value.toFixed(1)}${unit}`
    : `unavailable (${value.reason})`;
}

// Trace the analyzer's selected value through its retained representatives.
// Include equal sources rather than inventing a different winning-set tie-breaker.
export function algorithmEstimateSources(
  checkpoint: AlgorithmCheckpoint,
  liftFamily: LiftFamily,
): RepresentativeSet[] {
  const analysis = checkpoint.overview.lifts[liftFamily];
  const estimate = analysis.currentEstimatedMax;
  if (estimate.status !== "available") return [];

  return selectComparisonHistory(
    analysis.sessions,
    analysis.analysisTime,
    progressConfig,
  )
    .contextDays.slice(-progressConfig.supportWindow)
    .flatMap((day) => day.sessions)
    .flatMap((session) => {
      const source =
        analysis.currentEstimatedMaxBasis === "effort_adjusted"
          ? session.adjustedRepresentative
          : session.rawRepresentative;
      const value =
        analysis.currentEstimatedMaxBasis === "effort_adjusted"
          ? source?.adjustedEstimate
          : source?.rawEstimate;
      return source && value === estimate.value ? [source] : [];
    });
}

export function formatAlgorithmSource(
  scenario: AlgorithmScenario,
  source: RepresentativeSet,
): string {
  const index = scenario.history.findIndex(
    (exposure) => exposure.workout.id === source.workoutId,
  );
  if (index < 0)
    throw new Error("Estimated-max source is outside its scenario");
  const session = scenario.sessions[index];
  return `W${session.week} D${session.day} ${session.label}: ${source.weight}×${source.reps} @${source.rpe ?? "—"}`;
}

export function formatAlgorithmBenchmark(analysis: LiftAnalysis): string {
  const { benchmark, benchmarkUnavailableReason } = analysis.recommendation;
  if (!benchmark) return `unavailable (${benchmarkUnavailableReason})`;
  const rpe = benchmark.rpe ? `${benchmark.rpe.min}–${benchmark.rpe.max}` : "—";
  return `${benchmark.intent}: ${benchmark.weight}×${benchmark.reps} @${rpe} (${benchmark.reason})`;
}

export function describeAlgorithmCheckpoint(
  scenario: AlgorithmScenario,
  checkpoint: AlgorithmCheckpoint,
): string {
  const analysis = checkpoint.overview.lifts[scenario.liftFamily];
  const sources = algorithmEstimateSources(checkpoint, scenario.liftFamily);
  const otherLifts = ["squat", "bench", "deadlift"]
    .filter((family) => family !== scenario.liftFamily)
    .join("/");
  const emptyLifts = otherLifts[0].toUpperCase() + otherLifts.slice(1);
  return [
    `Scenario ${scenario.number}: ${scenario.title}. ${scenario.intent}`,
    `Actual analyzer output; competition ${scenario.liftFamily} only. All weights are kg. RPE is floored: 7.5 → 7, 8.5 → 8, 6.5 → 6. Missing RPE stays missing. RPE below 7 contributes to workload but is excluded from strength estimation.`,
    "Sessions finish at 18:00 local time: Monday heavy, Thursday volume, Saturday technique when present. The first Monday is January 5, 2026.",
    `Analysis immediately after week ${checkpoint.week}, day ${checkpoint.day}; only these ${checkpoint.history.length} completed sessions are supplied. The current calendar week is incomplete for workload comparisons. ${emptyLifts} have no history.`,
    [
      `Estimated max: ${formatAlgorithmMeasurement(analysis.currentEstimatedMax, " kg")} (${analysis.currentEstimatedMaxBasis ?? "no basis"}).`,
      `Winning source(s): ${sources.map((set) => formatAlgorithmSource(scenario, set)).join("; ") || "none"}.`,
      `Status: ${analysis.status.value} (${analysis.status.reason}, confirmed: ${analysis.status.confirmed}).`,
      `Strength: ${formatAlgorithmMeasurement(analysis.trends.performance.change, "%")} (${analysis.trends.basis}).`,
      `Effort: ${formatAlgorithmMeasurement(analysis.trends.effort.change, " RPE")} (${analysis.trends.effort.basis}); typical recorded effort change: ${formatAlgorithmMeasurement(analysis.trends.rpeChange, " RPE")}.`,
      `Workload: volume ${formatAlgorithmMeasurement(analysis.trends.volumeChange, "%")}; hard sets ${formatAlgorithmMeasurement(analysis.trends.hardSetsChange, "%")}; frequency ${formatAlgorithmMeasurement(analysis.trends.frequencyChange, "%")}.`,
      `Evidence: ${analysis.evidence.level}; ${analysis.evidence.supportingDays}/${analysis.evidence.consideredDays} supporting days (${analysis.evidence.reasons.join(", ") || "no limitations"}).`,
      `Diagnosis: ${analysis.diagnosis.kind} (${analysis.diagnosis.evidence}; ${analysis.diagnosis.reasons.join(", ") || "no reasons"}).`,
      `Action: ${analysis.recommendation.kind}. Benchmark: ${formatAlgorithmBenchmark(analysis)}.`,
    ].join("\n"),
    "Recorded input through this checkpoint:",
    ...checkpoint.history.map((exposure, index) => {
      const session = scenario.sessions[index];
      const sets = exposure.entries
        .flatMap((entry) => entry.sets)
        .map((set) => `${set.weight}×${set.reps} @${set.rpe ?? "—"}`)
        .join("; ");
      return `Week ${session.week} · Day ${session.day} · ${session.label}: ${sets}`;
    }),
  ].join("\n\n");
}
