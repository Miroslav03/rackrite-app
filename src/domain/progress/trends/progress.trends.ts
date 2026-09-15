import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";

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

  const basis = selectPerformanceBasis(
    raw,
    adjusted,
    effort.rpeAdequate,
    config,
  );

  const workload = compareWeeklyWorkload(
    sessions,
    history.allPerformanceDays,
    analysisTime,
    config,
  );

  return {
    basis,
    days: history.days,
    contextDays: history.contextDays,
    raw,
    adjusted,
    performance: basis === "load_reps" ? raw : adjusted,
    ...effort,
    ...workload,
    conflictingSignals: hasConflictingPerformanceSignals(
      raw,
      adjusted,
      basis,
      config,
    ),
    repetitionShift: hasRepresentativeRepetitionShift(
      history.days,
      history.recentStartsAt,
      config,
    ),
    gapReset: history.gapReset,
    maxGapDays: history.maxGapDays,
  };
}
