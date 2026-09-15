import { validTimestamp } from "@/shared/utils/localCalendar";

import type { CompetitionLiftExposure } from "../history/progress.history.types";
import { type ProgressConfig, progressConfig } from "../progress.config";

import type { ProgressOverview } from "./progress.analysis.types";
import { analyzeLift } from "./progress.analysis.utils";

export function analyzeCompetitionLifts(
  history: readonly CompetitionLiftExposure[],
  analysisTime: number,
  config: ProgressConfig = progressConfig,
): ProgressOverview {
  if (!validTimestamp(analysisTime))
    throw new Error("Invalid progress analysis time");

  return {
    analysisTime,
    lifts: {
      squat: analyzeLift(history, "squat", analysisTime, config),
      bench: analyzeLift(history, "bench", analysisTime, config),
      deadlift: analyzeLift(history, "deadlift", analysisTime, config),
    },
  };
}
