import {
  addLocalCalendarDays,
  localCalendarDay,
  startOfLocalDay,
  startOfLocalWeek,
} from "@/shared/utils/localCalendar";

import {
  available,
  percentChange,
  unavailable,
} from "../measurements/progress.measurements";
import { median } from "../measurements/progress.measurements.utils";
import { type ProgressConfig, progressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";

import type {
  ComparisonHistory,
  DailyPerformance,
  PerformanceBasis,
  TrendComparison,
  WeeklyLiftMetrics,
} from "./progress.trends.types";

function finiteValues(
  values: readonly (number | null | undefined)[],
): number[] {
  return values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
}

export function dailyValue(
  day: DailyPerformance,
  basis: PerformanceBasis,
): number | null {
  return basis === "load_reps" ? day.raw : day.adjusted;
}

// Multiple workouts on one day count as one performance observation.
export function deriveDailyPerformance(
  sessions: readonly LiftSessionMetrics[],
): DailyPerformance[] {
  const groups = new Map<number, LiftSessionMetrics[]>();

  for (const session of sessions) {
    if (!session.rawRepresentative) continue;

    const day = localCalendarDay(session.finishedAt);
    const group = groups.get(day) ?? [];

    group.push(session);
    groups.set(day, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, group]) => summarizePerformanceDay(day, group));
}

function summarizePerformanceDay(
  day: number,
  sessions: readonly LiftSessionMetrics[],
): DailyPerformance {
  return {
    day,
    finishedAt: Math.max(...sessions.map((session) => session.finishedAt)),
    sessions,
    raw:
      median(
        sessions.map((session) => session.rawRepresentative?.rawEstimate ?? 0),
      ) ?? 0,
    adjusted: median(
      finiteValues(
        sessions.map(
          (session) => session.adjustedRepresentative?.adjustedEstimate,
        ),
      ),
    ),
    representativeReps:
      median(
        finiteValues(
          sessions.map((session) => session.rawRepresentative?.reps),
        ),
      ) ?? 0,
  };
}

export function comparePerformance(
  days: readonly DailyPerformance[],
  endExclusive: number,
  basis: PerformanceBasis,
  config: ProgressConfig = progressConfig,
): TrendComparison {
  const startsAt = addLocalCalendarDays(endExclusive, -config.trendDays);
  const recentStartsAt = addLocalCalendarDays(
    endExclusive,
    -config.trendDays / 2,
  );

  const baselineValues = finiteValues(
    days
      .filter(
        (day) => day.finishedAt >= startsAt && day.finishedAt < recentStartsAt,
      )
      .map((day) => dailyValue(day, basis)),
  );
  const recentValues = finiteValues(
    days
      .filter(
        (day) =>
          day.finishedAt >= recentStartsAt && day.finishedAt < endExclusive,
      )
      .map((day) => dailyValue(day, basis)),
  );

  const baseline = median(baselineValues);
  const recent = median(recentValues);

  return {
    window: { from: startsAt, through: endExclusive - 1 },
    baseline,
    recent,
    baselineDays: baselineValues.length,
    recentDays: recentValues.length,
    change:
      baselineValues.length >= config.minimumHalfDays &&
      recentValues.length >= config.minimumHalfDays
        ? percentChange(baseline, recent)
        : unavailable("insufficient_history"),
  };
}

function rpeCoverage(sessions: readonly LiftSessionMetrics[]): number {
  const valid = sessions.reduce(
    (sum, session) => sum + session.validSetCount,
    0,
  );

  return valid
    ? sessions.reduce((sum, session) => sum + session.rpeSetCount, 0) / valid
    : 0;
}

function effortShare(sessions: readonly LiftSessionMetrics[]): number | null {
  const recorded = sessions.reduce(
    (sum, session) => sum + session.rpeSetCount,
    0,
  );

  return recorded
    ? sessions.reduce((sum, session) => sum + session.highEffortSetCount, 0) /
        recorded
    : null;
}

export function groupLiftWeeks(
  sessions: readonly LiftSessionMetrics[],
  days: readonly DailyPerformance[],
  analysisTime: number,
  count: number,
): WeeklyLiftMetrics[] {
  const thisWeek = startOfLocalWeek(analysisTime);
  const firstTrainingFinishedAt = sessions.find(
    (session) => session.validSetCount > 0,
  )?.finishedAt;

  return Array.from({ length: count }, (_, index) => {
    const startsAt = addLocalCalendarDays(thisWeek, (index - count + 1) * 7);
    const endExclusive = addLocalCalendarDays(startsAt, 7);

    const weeklySessions = sessions.filter(
      (session) =>
        session.finishedAt >= startsAt &&
        session.finishedAt < endExclusive &&
        session.validSetCount > 0,
    );
    const weeklyDays = days.filter(
      (day) => day.finishedAt >= startsAt && day.finishedAt < endExclusive,
    );

    return {
      startsAt,
      endsAt: endExclusive - 1,
      partial: endExclusive > analysisTime,
      raw: median(weeklyDays.map((day) => day.raw)),
      adjusted: median(finiteValues(weeklyDays.map((day) => day.adjusted))),
      volume:
        weeklySessions.length ||
        (firstTrainingFinishedAt !== undefined &&
          startsAt > firstTrainingFinishedAt)
          ? weeklySessions.reduce((sum, session) => sum + session.volume, 0)
          : null,
      exposures: weeklySessions.length,
    };
  });
}

export function selectComparisonHistory(
  sessions: readonly LiftSessionMetrics[],
  analysisTime: number,
  config: ProgressConfig,
): ComparisonHistory {
  const allPerformanceDays = deriveDailyPerformance(
    sessions.filter((session) => session.finishedAt <= analysisTime),
  );

  let latestSegmentStartIndex = 0;

  for (let index = 1; index < allPerformanceDays.length; index++)
    if (
      allPerformanceDays[index].day - allPerformanceDays[index - 1].day >
      config.resetGapDays
    )
      latestSegmentStartIndex = index;

  const continuousDays = allPerformanceDays.slice(latestSegmentStartIndex);
  const latestDay = continuousDays[continuousDays.length - 1];
  const endExclusive = addLocalCalendarDays(
    startOfLocalDay(latestDay?.finishedAt ?? analysisTime),
    1,
  );
  const startsAt = addLocalCalendarDays(endExclusive, -config.trendDays);
  const recentStartsAt = addLocalCalendarDays(
    endExclusive,
    -config.trendDays / 2,
  );
  const contextStart = addLocalCalendarDays(endExclusive, -config.contextDays);

  const contextDays = continuousDays.filter(
    (day) => day.finishedAt >= contextStart,
  );
  const days = contextDays.filter((day) => day.finishedAt >= startsAt);

  const segmentTime = startOfLocalDay(
    continuousDays[0]?.finishedAt ?? endExclusive,
  );
  const comparisonSessions = sessions.filter(
    (session) =>
      session.finishedAt >= Math.max(startsAt, segmentTime) &&
      session.finishedAt < endExclusive,
  );
  const baselineSessions = comparisonSessions.filter(
    (session) => session.finishedAt < recentStartsAt,
  );
  const recentSessions = comparisonSessions.filter(
    (session) => session.finishedAt >= recentStartsAt,
  );

  const maxGapDays = contextDays
    .slice(1)
    .reduce(
      (max, day, index) => Math.max(max, day.day - contextDays[index].day),
      0,
    );

  return {
    allPerformanceDays,
    days,
    contextDays,
    endExclusive,
    recentStartsAt,
    comparisonSessions,
    baselineSessions,
    recentSessions,
    gapReset: latestSegmentStartIndex > 0,
    maxGapDays,
  };
}

export function compareRecordedEffort(
  history: ComparisonHistory,
  config: ProgressConfig,
) {
  const { comparisonSessions, baselineSessions, recentSessions, days } =
    history;

  const baselineRpeDays = new Set(
    baselineSessions
      .filter((session) => session.typicalRpe !== null)
      .map((session) => localCalendarDay(session.finishedAt)),
  ).size;
  const recentRpeDays = new Set(
    recentSessions
      .filter((session) => session.typicalRpe !== null)
      .map((session) => localCalendarDay(session.finishedAt)),
  ).size;

  const rpeAdequate =
    baselineRpeDays >= config.minimumHalfDays &&
    recentRpeDays >= config.minimumHalfDays &&
    rpeCoverage(baselineSessions) >= config.rpeCoverage &&
    rpeCoverage(recentSessions) >= config.rpeCoverage;

  const baselineRpe = median(
    finiteValues(baselineSessions.map((session) => session.typicalRpe)),
  );
  const recentRpe = median(
    finiteValues(recentSessions.map((session) => session.typicalRpe)),
  );

  const hasRpe = comparisonSessions.some((session) => session.rpeSetCount > 0);
  const rpeChange =
    rpeAdequate && baselineRpe !== null && recentRpe !== null
      ? available(recentRpe - baselineRpe)
      : unavailable(hasRpe ? "partial_rpe" : "missing_rpe");
  const baselineHighEffortShare = effortShare(baselineSessions),
    recentHighEffortShare = rpeAdequate ? effortShare(recentSessions) : null;

  return {
    rpeChange,
    rpeAdequate,
    recentHighEffortShare,
    highEffortShareChange:
      rpeAdequate &&
      baselineHighEffortShare !== null &&
      recentHighEffortShare !== null
        ? recentHighEffortShare - baselineHighEffortShare
        : null,
    highEffortDays: new Set(
      recentSessions
        .filter(
          (session) =>
            session.highEffortSetCount > 0 &&
            days.some(
              (day) => day.day === localCalendarDay(session.finishedAt),
            ),
        )
        .map((session) => localCalendarDay(session.finishedAt)),
    ).size,
  };
}

export function selectPerformanceBasis(
  raw: TrendComparison,
  adjusted: TrendComparison,
  rpeAdequate: boolean,
  config: ProgressConfig,
): PerformanceBasis {
  const adjustedAdequate =
    adjusted.change.status === "available" &&
    rpeAdequate &&
    adjusted.baselineDays / Math.max(1, raw.baselineDays) >=
      config.adjustedDayCoverage &&
    adjusted.recentDays / Math.max(1, raw.recentDays) >=
      config.adjustedDayCoverage;

  return adjustedAdequate ? "effort_adjusted" : "load_reps";
}

export function compareWeeklyWorkload(
  sessions: readonly LiftSessionMetrics[],
  allPerformanceDays: readonly DailyPerformance[],
  analysisTime: number,
  config: ProgressConfig,
) {
  const allWeeks = groupLiftWeeks(
    sessions,
    allPerformanceDays,
    analysisTime,
    config.historyWeeks + 1,
  );

  const completeWeeks = allWeeks
    .filter((week) => !week.partial)
    .slice(-config.trendDays / 7);

  const weeksPerHalf = completeWeeks.length / 2;
  const firstTrainingFinishedAt = sessions.find(
    (session) => session.validSetCount > 0,
  )?.finishedAt;

  const hasCompleteWorkloadHistory =
    completeWeeks.length === config.trendDays / 7 &&
    firstTrainingFinishedAt !== undefined &&
    firstTrainingFinishedAt <= completeWeeks[0].startsAt &&
    completeWeeks.every((week) => week.volume !== null);

  const baselineWeeklyVolume =
    completeWeeks
      .slice(0, weeksPerHalf)
      .reduce((sum, week) => sum + (week.volume ?? 0), 0) / weeksPerHalf;
  const recentWeeklyVolume =
    completeWeeks
      .slice(weeksPerHalf)
      .reduce((sum, week) => sum + (week.volume ?? 0), 0) / weeksPerHalf;

  const baselineWeeklyFrequency =
    completeWeeks
      .slice(0, weeksPerHalf)
      .reduce((sum, week) => sum + week.exposures, 0) / weeksPerHalf;
  const recentWeeklyFrequency =
    completeWeeks
      .slice(weeksPerHalf)
      .reduce((sum, week) => sum + week.exposures, 0) / weeksPerHalf;

  return {
    volumeChange: hasCompleteWorkloadHistory
      ? percentChange(baselineWeeklyVolume, recentWeeklyVolume)
      : unavailable("incomplete_period"),
    frequencyChange: hasCompleteWorkloadHistory
      ? percentChange(baselineWeeklyFrequency, recentWeeklyFrequency)
      : unavailable("incomplete_period"),
    workloadWindow: {
      from: addLocalCalendarDays(
        startOfLocalWeek(analysisTime),
        -config.trendDays,
      ),
      through: startOfLocalWeek(analysisTime) - 1,
    },
    recentWeeklyVolume: hasCompleteWorkloadHistory ? recentWeeklyVolume : null,
    recentWeeklyFrequency: hasCompleteWorkloadHistory
      ? recentWeeklyFrequency
      : null,
    missingCompleteWeeks: completeWeeks.filter(
      (week) =>
        firstTrainingFinishedAt !== undefined &&
        week.startsAt > firstTrainingFinishedAt &&
        week.exposures === 0,
    ).length,
    weekly: allWeeks.slice(-config.chartWeeks),
  };
}

export function hasConflictingPerformanceSignals(
  raw: TrendComparison,
  adjusted: TrendComparison,
  basis: PerformanceBasis,
  config: ProgressConfig,
): boolean {
  const rawChange = raw.change.status === "available" ? raw.change.value : 0;
  const adjustedChange =
    adjusted.change.status === "available" ? adjusted.change.value : 0;

  return (
    basis === "effort_adjusted" &&
    ((rawChange >= config.progressPercent - config.comparisonEpsilon &&
      adjustedChange <= config.regressionPercent + config.comparisonEpsilon) ||
      (adjustedChange >= config.progressPercent - config.comparisonEpsilon &&
        rawChange <= config.regressionPercent + config.comparisonEpsilon))
  );
}

export function hasRepresentativeRepetitionShift(
  days: readonly DailyPerformance[],
  recentStartsAt: number,
  config: ProgressConfig,
): boolean {
  const baselineReps = median(
    days
      .filter((day) => day.finishedAt < recentStartsAt)
      .map((day) => day.representativeReps),
  );
  const recentReps = median(
    days
      .filter((day) => day.finishedAt >= recentStartsAt)
      .map((day) => day.representativeReps),
  );

  return (
    baselineReps !== null &&
    recentReps !== null &&
    Math.abs(recentReps - baselineReps) >= config.repetitionShift
  );
}
