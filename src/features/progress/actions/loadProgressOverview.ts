import type { ProgressOverview } from "@/domain/progress/analysis/progress.analysis.types";
import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import type { ProgressRepository } from "@/domain/progress/history/progress.history.types";
import {
  progressConfig,
  type ProgressConfig,
} from "@/domain/progress/progress.config";

import {
  addLocalCalendarDays,
  startOfLocalDay,
  validTimestamp,
} from "@/shared/utils/localCalendar";

export async function loadProgressOverview(
  dependencies: { repository: ProgressRepository; config?: ProgressConfig },
  analysisTime: number,
): Promise<ProgressOverview> {
  if (!validTimestamp(analysisTime))
    throw new Error("Invalid progress analysis time");

  const config = dependencies.config ?? progressConfig;

  const history =
    await dependencies.repository.getCompletedCompetitionLiftHistory({
      fromFinishedAt: Math.max(
        0,
        addLocalCalendarDays(
          startOfLocalDay(analysisTime),
          -config.historyWeeks * 7,
        ),
      ),
      throughFinishedAt: analysisTime,
    });

  return analyzeCompetitionLifts(history, analysisTime, config);
}
