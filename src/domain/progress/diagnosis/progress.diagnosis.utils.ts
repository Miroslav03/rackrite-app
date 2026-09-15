import { addLocalCalendarDays } from "@/shared/utils/localCalendar";

import { percentChange } from "../measurements/progress.measurements";
import type { ProgressConfig } from "../progress.config";
import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import { deriveLiftTrends } from "../trends/progress.trends";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";
import {
  comparePerformance,
  deriveDailyPerformance,
} from "../trends/progress.trends.utils";

import type { LiftDiagnosis } from "./progress.diagnosis.types";

export const uncertain: LiftDiagnosis = {
  kind: "insufficient_evidence",
  evidence: "weak",
  reasons: ["uncertain_cause"],
  referenceWindow: null,
};

export function compareProductiveWorkload(
  trends: LiftTrendMetrics,
  sessions: readonly LiftSessionMetrics[],
  config: ProgressConfig,
): LiftDiagnosis {
  const days = deriveDailyPerformance(sessions);

  for (
    let index = 0;
    index < config.historyWeeks / (config.trendDays / 7) - 1;
    index++
  ) {
    const end = addLocalCalendarDays(
      trends.workloadWindow.from,
      -index * config.trendDays,
    );
    const start = addLocalCalendarDays(end, -config.trendDays);
    const period = sessions.filter(
      (session) =>
        session.finishedAt >= start &&
        session.finishedAt < end &&
        session.validSetCount > 0,
    );
    const comparison = comparePerformance(days, end, trends.basis, config);
    const priorTrends = deriveLiftTrends(period, end - 1, config);

    if (
      priorTrends.conflictingSignals ||
      (trends.basis === "effort_adjusted" &&
        priorTrends.basis !== "effort_adjusted")
    )
      continue;

    // Never call a period productive from an incomparable gap or a single outlier.
    const periodDays = days.filter(
      (day) => day.finishedAt >= start && day.finishedAt < end,
    );

    if (
      comparison.change.status !== "available" ||
      comparison.change.value <
        config.progressPercent - config.comparisonEpsilon ||
      periodDays.length < config.minimumDays
    )
      continue;

    if (
      periodDays[periodDays.length - 1].day - periodDays[0].day <
        config.minimumSpanDays ||
      periodDays
        .slice(1)
        .some((day, i) => day.day - periodDays[i].day > config.regularGapDays)
    )
      continue;

    const volume =
      period.reduce((sum, session) => sum + session.volume, 0) /
      (config.trendDays / 7);
    const frequency = period.length / (config.trendDays / 7);
    const volumeChange = percentChange(volume, trends.recentWeeklyVolume);
    const frequencyChange = percentChange(
      frequency,
      trends.recentWeeklyFrequency,
    );

    if (
      volumeChange.status === "available" &&
      volumeChange.value <= config.stimulusVolumeDrop
    )
      return {
        kind: "insufficient_stimulus",
        evidence: "moderate",
        reasons: ["lower_historical_workload"],
        referenceWindow: { from: start, through: end - 1 },
      };

    if (
      frequencyChange.status === "available" &&
      frequencyChange.value <= -config.frequencyChangePercent
    )
      return {
        kind: "insufficient_stimulus",
        evidence: "moderate",
        reasons: ["lower_historical_frequency"],
        referenceWindow: { from: start, through: end - 1 },
      };

    // The closest qualifying productive block owns the comparison.
    return uncertain;
  }

  return uncertain;
}
