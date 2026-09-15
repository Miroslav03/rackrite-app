import {
  localCalendarDay,
  startOfLocalWeek,
} from "@/shared/utils/localCalendar";

import { percentChange } from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import type {
  DailyPerformance,
  LiftTrendMetrics,
} from "../trends/progress.trends.types";
import { dailyValue } from "../trends/progress.trends.utils";

import type { LiftStatus, StatusReason } from "./progress.status.types";

export function supportingDayCount(
  trends: LiftTrendMetrics,
  status: LiftStatus,
  count: number,
  config: ProgressConfig = progressConfig,
): number {
  const baseline = trends.performance.baseline;

  if (baseline === null || baseline <= 0) return 0;

  return trends.days.slice(-count).filter((day) => {
    const value = dailyValue(day, trends.basis);

    if (value === null) return false;

    const delta = (value / baseline - 1) * 100;

    if (status === "progressing")
      return delta >= config.progressSupportPercent - config.comparisonEpsilon;

    if (status === "regressing")
      return (
        delta <= config.regressionSupportPercent + config.comparisonEpsilon
      );

    return (
      Math.abs(delta) <= config.flatSupportPercent + config.comparisonEpsilon
    );
  }).length;
}

function span(days: readonly DailyPerformance[]): number {
  return days.length ? days[days.length - 1].day - days[0].day : 0;
}

export function learningReason(
  sessions: readonly LiftSessionMetrics[],
  trends: LiftTrendMetrics,
  analysisTime: number,
  config: ProgressConfig,
): StatusReason | null {
  if (sessions.some((session) => session.issues.includes("ambiguous_identity")))
    return "ambiguous_identity";

  if (!sessions.length) return "no_history";

  const last = trends.contextDays[trends.contextDays.length - 1];

  if (!last) return "no_performance";

  if (localCalendarDay(analysisTime) - last.day > config.staleDays)
    return "stale_history";

  if (trends.conflictingSignals) return "conflicting_signals";

  if (
    trends.days.length < config.minimumDays ||
    span(trends.days) < config.minimumSpanDays ||
    trends.performance.change.status !== "available"
  )
    return trends.gapReset ? "training_gap" : "insufficient_history";

  return null;
}

function isPlateau(trends: LiftTrendMetrics, config: ProgressConfig): boolean {
  if (
    trends.contextDays.length < config.plateauDays ||
    span(trends.contextDays) < config.plateauSpanDays ||
    trends.maxGapDays > config.regularGapDays
  )
    return false;

  if (
    new Set(trends.contextDays.map((day) => startOfLocalWeek(day.finishedAt)))
      .size < config.plateauWeeks
  )
    return false;

  const endDay = localCalendarDay(trends.performance.window.through) + 1;
  const medians: number[] = [];

  for (
    let index = 0;
    index < config.trendDays / config.plateauBlockDays;
    index++
  ) {
    const blockEnd = endDay - index * config.plateauBlockDays;
    const values = trends.days
      .filter(
        (day) =>
          day.day >= blockEnd - config.plateauBlockDays && day.day < blockEnd,
      )
      .map((day) => dailyValue(day, trends.basis))
      .filter((value): value is number => value !== null);

    if (values.length < config.plateauBlockMinimumDays) return false;

    const value = median(values);

    if (value === null) return false;

    medians.push(value);
  }

  const minimum = Math.min(...medians);

  return (
    minimum > 0 &&
    (Math.max(...medians) / minimum - 1) * 100 <=
      config.plateauBandPercent + config.comparisonEpsilon
  );
}

export function candidateStatus(
  trends: LiftTrendMetrics,
  previouslyProgressed: boolean,
  config: ProgressConfig,
): LiftStatus {
  const change = trends.performance.change;

  if (change.status !== "available") return "learning";

  const delta = change.value;

  if (
    delta <= config.regressionPercent + config.comparisonEpsilon &&
    supportingDayCount(trends, "regressing", config.supportWindow, config) >=
      config.supportDays
  )
    return "regressing";

  if (
    delta >= config.progressPercent - config.comparisonEpsilon &&
    supportingDayCount(trends, "progressing", config.supportWindow, config) >=
      config.supportDays
  )
    return "progressing";

  if (
    Math.abs(delta) <= config.neutralPercent + config.comparisonEpsilon &&
    isPlateau(trends, config)
  )
    return "plateaued";

  const recent = trends.days
    .slice(-config.supportWindow * 2)
    .map((day) => dailyValue(day, trends.basis));
  const before = median(
    recent
      .slice(0, config.supportWindow)
      .filter((v): v is number => v !== null),
  );
  const after = median(
    recent.slice(config.supportWindow).filter((v): v is number => v !== null),
  );
  const shortChange = percentChange(before, after);

  if (
    (delta > config.regressionPercent + config.comparisonEpsilon &&
      delta < -config.neutralPercent - config.comparisonEpsilon) ||
    (previouslyProgressed &&
      delta < config.progressPercent - config.comparisonEpsilon &&
      shortChange.status === "available" &&
      Math.abs(shortChange.value) <=
        config.neutralPercent + config.comparisonEpsilon)
  )
    return "stalling";

  return "stable";
}
