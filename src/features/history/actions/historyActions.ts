import {
  type WorkoutHistoryRepository,
  workoutHistoryRepository,
} from "@/data/repositories/historyRepository";
import {
  workoutRepository,
  type WorkoutRepository,
} from "@/data/repositories/workoutRepository";

import type {
  HistoryCursor,
  HistoryPage,
  HistoryWorkoutDetails,
} from "@/domain/history/history.types";

import { loadHistoryDetails } from "./loadHistoryDetails";
import { loadHistoryOverview } from "./loadHistoryOverview";
import { HISTORY_PAGE_SIZE, loadHistoryPage } from "./loadHistoryPage";

export type HistoryActions = {
  loadDetails: (workoutId: string) => Promise<HistoryWorkoutDetails | null>;
  loadOverview: () => Promise<{
    page: HistoryPage;
    totalCount: number;
  }>;
  loadNextPage: (cursor: HistoryCursor) => Promise<HistoryPage>;
};

type CreateHistoryActionsDependencies = {
  repository: WorkoutHistoryRepository;
  workoutRepository: Pick<WorkoutRepository, "getWorkoutAggregateById">;
};

export function createHistoryActions(
  dependencies: CreateHistoryActionsDependencies,
): HistoryActions {
  return {
    loadDetails: (workoutId) =>
      loadHistoryDetails(
        { repository: dependencies.workoutRepository },
        workoutId,
      ),
    loadOverview: () => loadHistoryOverview(dependencies),
    loadNextPage: (cursor: HistoryCursor) =>
      loadHistoryPage(dependencies, { limit: HISTORY_PAGE_SIZE, cursor }),
  };
}

export const historyActions = createHistoryActions({
  repository: workoutHistoryRepository,
  workoutRepository,
});
