import type { HistoryWorkoutDetails } from "@/domain/history/history.types";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

import { SET_TYPE_CONFIG } from "@/shared/theme/setTypes";
import { getWorkoutDisplayName } from "@/shared/utils/getWorkoutDisplayName";

import { performedDateFormatter, weightFormatter } from "./historyDate.utils";

export function createHistoryDetailsViewModel(workout: HistoryWorkoutDetails) {
  return {
    name: getWorkoutDisplayName(workout.sourceTemplateId),
    date: performedDateFormatter.format(workout.startedAt).toUpperCase(),
    duration: `${workout.durationMinutes} MIN`,
    totalVolume: weightFormatter.format(workout.totalWeight),
    totalSets: String(workout.totalSets),
    averageRpe: workout.averageRpe?.toFixed(1) ?? "—",
    exercises: workout.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      kind: formatExerciseKind(exercise.kind),
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        number: String(index + 1).padStart(2, "0"),
        type: SET_TYPE_CONFIG[set.type],
        weight: weightFormatter.format(set.weight),
        reps: String(set.reps),
        rpe: set.rpe?.toFixed(1) ?? "—",
      })),
    })),
  };
}

export type HistoryDetailsViewModel = ReturnType<
  typeof createHistoryDetailsViewModel
>;
