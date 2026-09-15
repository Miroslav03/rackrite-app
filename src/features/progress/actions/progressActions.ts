import { progressRepository } from "@/data/repositories/progressRepository";

import type { ProgressOverview } from "@/domain/progress/analysis/progress.analysis.types";
import type { ProgressRepository } from "@/domain/progress/history/progress.history.types";
import type { ProgressConfig } from "@/domain/progress/progress.config";

import { loadProgressOverview } from "./loadProgressOverview";

export type ProgressActions = {
  loadOverview: (analysisTime: number) => Promise<ProgressOverview>;
};

export function createProgressActions(dependencies: {
  repository: ProgressRepository;
  config?: ProgressConfig;
}): ProgressActions {
  return {
    loadOverview: (analysisTime) =>
      loadProgressOverview(dependencies, analysisTime),
  };
}

export const progressActions = createProgressActions({
  repository: progressRepository,
});
