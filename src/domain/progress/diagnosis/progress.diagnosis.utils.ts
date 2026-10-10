import {
  addLocalCalendarDays,
  localCalendarDay,
} from "@/shared/utils/localCalendar";
import { percentChange } from "../measurements/progress.measurements";
import type { AnalysisWindow } from "../measurements/progress.measurements.types";
import { median } from "../measurements/progress.measurements.utils";
import type { ProgressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import { supportingDayCount } from "../status/progress.status.utils";
import { deriveLiftTrends } from "../trends/progress.trends";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";
import { rpeCoverage } from "../trends/progress.trends.utils";
import type { LiftDiagnosis } from "./progress.diagnosis.types";

export const uncertain: LiftDiagnosis = {
  kind: "insufficient_evidence",
  evidence: "weak",
  reasons: ["uncertain_cause"],
  referenceWindow: null,
};

function typicalEffort(sessions: readonly LiftSessionMetrics[]): number | null {
  const days = new Map<number, number[]>();
  for (const session of sessions) {
    if (session.typicalRpe === null) continue;
    const day = localCalendarDay(session.finishedAt);
    const values = days.get(day) ?? [];
    values.push(session.typicalRpe);
    days.set(day, values);
  }
  return median(
    [...days.values()].flatMap((values) => {
      const value = median(values);
      return value === null ? [] : [value];
    }),
  );
}

export function compareProductiveWorkload(
  trends: LiftTrendMetrics,
  sessions: readonly LiftSessionMetrics[],
  config: ProgressConfig,
) {
  if (
    trends.recentWeeklyHardSets === null ||
    trends.recentWeeklyFrequency === null
  )
    return null;
  const recentStart = addLocalCalendarDays(
    trends.workloadWindow.through + 1,
    -config.trendDays / 2,
  );
  const recent = sessions.filter(
    (session) =>
      session.finishedAt >= recentStart &&
      session.finishedAt <= trends.workloadWindow.through,
  );
  const recentRpe = typicalEffort(recent);
  if (recentRpe === null || rpeCoverage(recent) < config.rpeCoverage)
    return null;
  const earliest = sessions[0]?.finishedAt;
  if (earliest === undefined) return null;

  for (let offset = 0; offset < config.historyWeeks; offset++) {
    const end = addLocalCalendarDays(trends.workloadWindow.from, -offset * 7);
    const start = addLocalCalendarDays(end, -config.trendDays);
    if (start < earliest) break;
    const period = sessions.filter(
      (session) => session.finishedAt >= start && session.finishedAt < end,
    );
    const prior = deriveLiftTrends(period, end - 1, config);
    if (
      prior.basis !== trends.basis ||
      prior.conflictingSignals ||
      prior.maxGapDays > config.regularGapDays ||
      prior.days.length < config.minimumDays ||
      prior.days[prior.days.length - 1].day - prior.days[0].day <
        config.minimumSpanDays ||
      prior.performance.change.status !== "available" ||
      prior.performance.change.value <
        config.progressPercent - config.comparisonEpsilon ||
      supportingDayCount(prior, "progressing", config.supportWindow, config) <
        config.supportDays
    )
      continue;
    if (
      prior.strength.buckets.length &&
      !prior.strength.buckets.some((bucket) =>
        trends.strength.buckets.some((current) => current.key === bucket.key),
      )
    )
      continue;
    const coverage = rpeCoverage(period);
    if (
      coverage < config.rpeCoverage ||
      Math.abs(coverage - rpeCoverage(recent)) >
        config.workloadCoverageDifference + config.comparisonEpsilon
    )
      continue;
    const referenceRpe = typicalEffort(period);
    if (referenceRpe === null) continue;
    const hardSets =
      period.reduce((sum, session) => sum + session.hardSetCount, 0) /
      (config.trendDays / 7);
    const frequency =
      new Set(
        period
          .filter((session) => session.validSetCount > 0)
          .map((session) => localCalendarDay(session.finishedAt)),
      ).size /
      (config.trendDays / 7);
    const window: AnalysisWindow = { from: start, through: end - 1 };
    return {
      window,
      hardSetsChange: percentChange(hardSets, trends.recentWeeklyHardSets),
      frequencyChange: percentChange(frequency, trends.recentWeeklyFrequency),
      rpeChange: recentRpe - referenceRpe,
    };
  }
  return null;
}
