import { median } from "../measurements/progress.measurements.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import { deriveEffortComparison } from "../strength/progress.effort";
import { deriveStrengthComparison } from "../strength/progress.strength";
import type { LiftTrendMetrics } from "./progress.trends.types";
import {
  comparePerformance,
  compareRecordedEffort,
  compareWeeklyWorkload,
  hasConflictingPerformanceSignals,
  hasRepresentativeRepetitionShift,
  selectComparisonHistory,
  selectPerformanceBasis,
} from "./progress.trends.utils";

export function deriveLiftTrends(
  sessions: readonly LiftSessionMetrics[],
  analysisTime: number,
  config: ProgressConfig = progressConfig,
): LiftTrendMetrics {
  const history = selectComparisonHistory(sessions, analysisTime, config);
  const effort = compareRecordedEffort(history, config);

  const raw = comparePerformance(
    history.days,
    history.endExclusive,
    "load_reps",
    config,
  );
  const adjusted = comparePerformance(
    history.days,
    history.endExclusive,
    "effort_adjusted",
    config,
  );

  const estimateBasis = selectPerformanceBasis(
    raw,
    adjusted,
    effort.rpeAdequate,
    config,
  );

  const strength = deriveStrengthComparison(
    history,
    raw,
    adjusted,
    estimateBasis,
    effort.rpeAdequate,
    config,
  );

  const matchedEffort = deriveEffortComparison(
    history,
    sessions,
    effort.rpeChange,
    effort.rpeAdequate,
    config,
  );

  const usableDays = new Set(
    strength.buckets.length
      ? strength.daily.filter((day) => day.value !== null).map((day) => day.day)
      : history.contextDays
          .filter(
            (day) => estimateBasis === "load_reps" || day.adjusted !== null,
          )
          .map((day) => day.day),
  );

  const workload = compareWeeklyWorkload(sessions, analysisTime, config);

  // Corroborate estimates from the selected source sets, not unrelated rep schemes.
  const alignedDays = history.days.flatMap((day) => {
    const sources =
      strength.daily.find((point) => point.day === day.day)?.sources ?? [];
    const paired = sources.filter((set) => set.adjustedEstimate !== null);

    const pairedRaw = median(paired.map((set) => set.rawEstimate));
    const pairedAdjusted = median(
      paired.flatMap((set) =>
        set.adjustedEstimate === null ? [] : [set.adjustedEstimate],
      ),
    );

    return pairedRaw === null || pairedAdjusted === null
      ? []
      : [{ ...day, raw: pairedRaw, adjusted: pairedAdjusted }];
  });

  return {
    basis: strength.basis,
    strength,
    effort: matchedEffort,
    days: history.days.filter((day) => usableDays.has(day.day)),
    contextDays: history.contextDays.filter((day) => usableDays.has(day.day)),
    raw,
    adjusted,
    performance: strength,
    ...effort,
    ...workload,
    conflictingSignals: hasConflictingPerformanceSignals(
      comparePerformance(
        alignedDays,
        history.endExclusive,
        "load_reps",
        config,
      ),
      comparePerformance(
        alignedDays,
        history.endExclusive,
        "effort_adjusted",
        config,
      ),
      estimateBasis,
      config,
    ),
    repetitionShift:
      strength.buckets.length === 0 &&
      hasRepresentativeRepetitionShift(
        history.days,
        history.recentStartsAt,
        config,
      ),
    gapReset: history.gapReset,
    maxGapDays: history.maxGapDays,
  };
}
