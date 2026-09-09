import {
  type WorkoutHistoryRepository,
  workoutHistoryRepository,
} from "@/data/repositories/historyRepository";

import type {
  HistoryCursor,
  HistoryPage,
} from "@/domain/history/history.types";

import { loadHistoryOverview } from "./loadHistoryOverview";
import { HISTORY_PAGE_SIZE, loadHistoryPage } from "./loadHistoryPage";

export type HistoryActions = {
  loadOverview: () => Promise<{
    page: HistoryPage;
    totalCount: number;
  }>;
  loadNextPage: (cursor: HistoryCursor) => Promise<HistoryPage>;
};

type CreateHistoryActionsDependencies = {
  repository: WorkoutHistoryRepository;
};

export function createHistoryActions(
  dependencies: CreateHistoryActionsDependencies,
): HistoryActions {
  return {
    loadOverview: () => loadHistoryOverview(dependencies),
    loadNextPage: (cursor: HistoryCursor) =>
      loadHistoryPage(dependencies, { limit: HISTORY_PAGE_SIZE, cursor }),
  };
}

export const historyActions = createHistoryActions({
  repository: workoutHistoryRepository,
});
