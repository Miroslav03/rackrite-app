import { startOfLocalDay } from "@/shared/utils/localCalendar";

import type { LiftSessionMetrics } from "../sessions/progress.sessions.types";
import type { LiftTrendMetrics } from "../trends/progress.trends.types";

import type { EvidenceFact } from "./progress.evidence.types";

export function calculateValidRecordShare(
  sessions: readonly LiftSessionMetrics[],
  trends: LiftTrendMetrics,
): number {
  const relevant = sessions.filter(
    (session) =>
      session.finishedAt >=
      (trends.contextDays.length
        ? startOfLocalDay(trends.contextDays[0].finishedAt)
        : Infinity),
  );

  const total = relevant.reduce(
    (sum, session) => sum + session.completedSetCount,
    0,
  );

  const validShare = total
    ? relevant.reduce((sum, session) => sum + session.validSetCount, 0) / total
    : 0;

  return validShare;
}

export function createEvidenceFacts(
  sessions: readonly LiftSessionMetrics[],
  trends: LiftTrendMetrics,
): EvidenceFact[] {
  return [
    {
      metric: "performance",
      change: trends.performance.change,
      window: trends.performance.window,
      workoutIds: trends.days.flatMap((day) =>
        day.sessions.map((session) => session.workoutId),
      ),
    },
    {
      metric: "e1rm",
      change: trends.raw.change,
      window: trends.raw.window,
      workoutIds: trends.days.flatMap((day) =>
        day.sessions.map((session) => session.workoutId),
      ),
    },
    {
      metric: "rpe",
      change: trends.rpeChange,
      window: trends.performance.window,
      workoutIds: sessions
        .filter(
          (session) =>
            session.typicalRpe !== null &&
            session.finishedAt >= trends.performance.window.from &&
            session.finishedAt <= trends.performance.window.through,
        )
        .map((session) => session.workoutId),
    },
    ...(["volume", "frequency"] as const).map((metric) => ({
      metric,
      change:
        metric === "volume" ? trends.volumeChange : trends.frequencyChange,
      window: trends.workloadWindow,
      workoutIds: sessions
        .filter(
          (session) =>
            session.finishedAt >= trends.workloadWindow.from &&
            session.finishedAt <= trends.workloadWindow.through &&
            session.validSetCount > 0,
        )
        .map((session) => session.workoutId),
    })),
  ];
}
