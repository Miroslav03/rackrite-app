import { localCalendarDay, validTimestamp } from "@/shared/utils/localCalendar";

import { type ProgressConfig, progressConfig } from "../progress.config";
import type { WorkoutRepObservations } from "../strength/progress.dailyRepObservations.types";

import type {
  StrengthTrendInterpretation,
  StrengthTrendInterpretationInput,
  StrengthTrendReason,
  StrengthTrendStatus,
} from "./progress.strengthTrendInterpretation.types";

function latestEligiblePerformance(
  history: readonly WorkoutRepObservations[],
  analysisTime: number,
): number | null {
  let latest: number | null = null;

  for (const workout of history) {
    if (
      validTimestamp(workout.finishedAt) &&
      workout.finishedAt <= analysisTime &&
      workout.observations.some(
        ({ rawRepresentative }) =>
          Number.isFinite(rawRepresentative.rawEstimate) &&
          rawRepresentative.rawEstimate > 0,
      )
    ) {
      latest = Math.max(latest ?? workout.finishedAt, workout.finishedAt);
    }
  }

  return latest;
}

/**
 * Interprets only Step 6's selection; percentages and method priority stay upstream.
 * The caller supplies the latest validated history segment (resetGapDays) and
 * windows ending at local midnight immediately after its latest eligible lift day.
 * analysisTime controls freshness without moving that last-performance anchor.
 */
export function interpretStrengthTrend(
  input: StrengthTrendInterpretationInput,
  config: ProgressConfig = progressConfig,
): StrengthTrendInterpretation {
  const { selected, analysisTime, history, historyContext } = input;

  if (!validTimestamp(analysisTime)) {
    throw new Error("Invalid progress analysis time");
  }

  function conclude(
    status: StrengthTrendStatus,
    reason: StrengthTrendReason,
  ): StrengthTrendInterpretation {
    return {
      family: selected.family,
      status,
      reason,
      selected,
    };
  }

  const liftHistory = history.filter(
    (workout) => workout.family === selected.family,
  );
  if (liftHistory.length === 0)
    return conclude("building_history", "no_history");

  const lastPerformance = latestEligiblePerformance(liftHistory, analysisTime);
  if (lastPerformance === null)
    return conclude("building_history", "no_performance");

  const historyReason = historyContext?.hadTrainingGap
    ? "training_gap"
    : "insufficient_history";
  if (selected.method === "building_history") {
    return conclude("building_history", historyReason);
  }

  if (
    localCalendarDay(analysisTime) - localCalendarDay(lastPerformance) >
    config.strengthTrendStaleDays
  ) {
    return conclude("building_history", "stale_history");
  }

  const { trend } = selected;
  const { change } = trend;

  if (change.status === "unavailable") {
    return conclude("building_history", change.reason);
  }
  if (!Number.isFinite(change.value) || trend.family !== selected.family) {
    return conclude("building_history", "invalid_baseline");
  }

  if (selected.method === "comparable") {
    const { agreement, contributingReps, measurementBasis } = selected.trend;
    if (
      agreement === "insufficient" ||
      contributingReps.length === 0 ||
      measurementBasis === "insufficient"
    ) {
      return conclude("building_history", historyReason);
    }
    if (agreement === "major_conflict")
      return conclude("unclear", "major_conflict");
    if (agreement === "uneven")
      return conclude("unclear", "uneven_performance");
  } else if (
    selected.trend.basis !==
    (selected.method === "rpe_adjusted_fallback"
      ? "rpe_adjusted"
      : "raw_brzycki")
  ) {
    return conclude("building_history", "invalid_baseline");
  }

  if (change.value >= config.progressPercent - config.comparisonEpsilon) {
    return conclude("progressing", "measured_improvement");
  }
  if (change.value <= config.regressionPercent + config.comparisonEpsilon) {
    return conclude("regressing", "measured_decline");
  }

  return conclude("maintaining", "measured_maintenance");
}
