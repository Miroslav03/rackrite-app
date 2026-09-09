import type { LiftFamily } from "@/domain/domain.types";
import type { HistoryWorkoutSummary } from "@/domain/history/history.types";

import { SET_TYPE_CONFIG, SET_TYPE_ORDER } from "@/shared/theme/setTypes";
import { getWorkoutDisplayName } from "@/shared/utils/getWorkoutDisplayName";

import {
  formatHistoryPerformedAt,
  formatHistoryRelativeDay,
} from "./historyDate.utils";

const liftLabels: Record<LiftFamily, string> = {
  bench: "Bench",
  squat: "Squat",
  deadlift: "Deadlift",
};
const weightFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function createHistoryCardViewModel(
  summary: HistoryWorkoutSummary,
  now: number,
) {
  return {
    workoutName: getWorkoutDisplayName(summary.sourceTemplateId),
    duration: `${summary.durationMinutes} min`,
    liftBadges: summary.liftFamilies.map((family) => ({
      family,
      label: liftLabels[family],
    })),
    exercises: summary.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      totalSets: `${exercise.totalSets} ${exercise.totalSets === 1 ? "set" : "sets"}`,
      topSet: `Top: ${weightFormatter.format(exercise.topSet.weight)} kg × ${exercise.topSet.reps}`,
      setBadges: SET_TYPE_ORDER.filter(
        (type) => exercise.setCounts[type] > 0,
      ).map((type) => ({
        type,
        label: `${type === "top" ? "Top" : SET_TYPE_CONFIG[type].label} ${exercise.setCounts[type]}`,
      })),
    })),
    relativeDay: formatHistoryRelativeDay(summary.startedAt, now),
    totalWeight: `${weightFormatter.format(summary.totalWeight)} kg total`,
    performedAt: formatHistoryPerformedAt(summary.startedAt),
  };
}
