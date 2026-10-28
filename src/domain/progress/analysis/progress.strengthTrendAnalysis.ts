import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  startOfLocalDay,
  validTimestamp,
} from "@/shared/utils/localCalendar";

import type { CompetitionLiftExposure } from "../history/progress.history.types";
import { type ProgressConfig, progressConfig } from "../progress.config";
import { deriveLiftSessions } from "../sessions/progress.sessions";
import { interpretStrengthTrend } from "../status/progress.strengthTrendInterpretation";
import { deriveDailyRepObservations } from "../strength/progress.dailyRepObservations";
import type {
  DailyRepObservation,
  WorkoutRepObservations,
} from "../strength/progress.dailyRepObservations.types";
import { deriveFallbackStrengthTrends } from "../strength/progress.fallbackStrength";
import { deriveOverallRepTrends } from "../strength/progress.overallRepTrends";
import { deriveRepLaneTrends } from "../strength/progress.repLaneTrends";
import type {
  RepLaneTrend,
  RepLaneWindow,
} from "../strength/progress.repLaneTrends.types";
import { createRepLaneWindow } from "../strength/progress.repLaneWindow";
import { deriveWorkoutRepObservations } from "../strength/progress.repObservations";
import { selectStrengthTrend } from "../strength/progress.strengthTrendSelector";
import type {
  SelectedStrengthTrend,
  StrengthTrendWindowCandidates,
} from "../strength/progress.strengthTrendSelector.types";
import { selectLatestPerformanceSegment } from "../trends/progress.trends.utils";

import type {
  LiftStrengthTrendAnalysis,
  StrengthTrendAnalysis,
} from "./progress.strengthTrendAnalysis.types";

type WindowCandidates = StrengthTrendWindowCandidates & {
  repLaneTrends: RepLaneTrend[];
};

/** Inputs already belong to one competition lift and its latest history segment. */
function deriveWindowCandidates(
  history: readonly WorkoutRepObservations[],
  daily: readonly DailyRepObservation[],
  window: RepLaneWindow,
  config: ProgressConfig,
): WindowCandidates {
  const repLaneTrends = deriveRepLaneTrends(daily, window, config);
  return {
    window,
    repLaneTrends,
    comparable: deriveOverallRepTrends(repLaneTrends, config)[0],
    adjustedFallback: deriveFallbackStrengthTrends(
      history,
      window,
      "rpe_adjusted",
      config,
    )[0],
    rawFallback: deriveFallbackStrengthTrends(
      history,
      window,
      "raw_brzycki",
      config,
    )[0],
  };
}

function analyzeLiftStrengthTrend(
  exposures: readonly CompetitionLiftExposure[],
  family: LiftFamily,
  analysisTime: number,
  config: ProgressConfig,
): LiftStrengthTrendAnalysis {
  const sessions = deriveLiftSessions(exposures, family, analysisTime, config);
  const preparedSessions = sessions.map((session) => ({
    session,
    observations: deriveWorkoutRepObservations(session.strengthSets),
  }));
  const segment = selectLatestPerformanceSegment(
    preparedSessions
      .filter(({ observations }) => observations.length > 0)
      .map(({ session }) => session),
    analysisTime,
    config,
  );
  const latestDay = segment.days[segment.days.length - 1];
  const segmentWorkoutIds = new Set(
    segment.days.flatMap((day) =>
      day.sessions.map((session) => session.workoutId),
    ),
  );
  // Keep unusable logged history for diagnostics only when no eligible segment exists.
  const history: WorkoutRepObservations[] = preparedSessions
    .filter(
      ({ session }) => !latestDay || segmentWorkoutIds.has(session.workoutId),
    )
    .map(({ session, observations }) => ({
      workoutId: session.workoutId,
      family: session.family,
      finishedAt: session.finishedAt,
      observations,
    }));

  let selected: SelectedStrengthTrend = { method: "building_history", family };
  let repLaneTrends: readonly RepLaneTrend[] = [];

  if (latestDay) {
    const endExclusive = addLocalCalendarDays(
      startOfLocalDay(latestDay.finishedAt),
      1,
    );
    const daily = deriveDailyRepObservations(history);
    const windows = {
      early: deriveWindowCandidates(
        history,
        daily,
        createRepLaneWindow(endExclusive, "early"),
        config,
      ),
      established: deriveWindowCandidates(
        history,
        daily,
        createRepLaneWindow(endExclusive, "established"),
        config,
      ),
    };
    selected = selectStrengthTrend({ family, history, ...windows });
    if (selected.method === "comparable") {
      repLaneTrends = windows[selected.windowMode].repLaneTrends;
    }
  }

  return {
    ...interpretStrengthTrend(
      {
        selected,
        history,
        analysisTime,
        historyContext: { hadTrainingGap: segment.gapReset },
      },
      config,
    ),
    history,
    gapReset: segment.gapReset,
    repLaneTrends,
  };
}

/**
 * Pure Steps 1–7 analysis, separate from the production Progress pipeline.
 * Each lift's windows end at local midnight after its last eligible performance;
 * the supplied analysisTime controls freshness without shifting those windows.
 */
export function analyzeStrengthTrends(
  history: readonly CompetitionLiftExposure[],
  analysisTime: number,
  config: ProgressConfig = progressConfig,
): StrengthTrendAnalysis {
  if (!validTimestamp(analysisTime))
    throw new Error("Invalid progress analysis time");

  return {
    analysisTime,
    lifts: {
      squat: analyzeLiftStrengthTrend(history, "squat", analysisTime, config),
      bench: analyzeLiftStrengthTrend(history, "bench", analysisTime, config),
      deadlift: analyzeLiftStrengthTrend(
        history,
        "deadlift",
        analysisTime,
        config,
      ),
    },
  };
}
