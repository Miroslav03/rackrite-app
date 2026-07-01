import {
  getActiveWorkoutAggregate,
  saveWorkoutAggregate,
} from "@/data/repositories/workoutRepository";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";
import { createEmptyWorkout } from "@/domain/workout/workout.useCases";

import { createId } from "@/shared/utils/id";

export async function startQuickWorkout(): Promise<WorkoutAggregate> {
  const existingActiveWorkout = await getActiveWorkoutAggregate();

  if (existingActiveWorkout) {
    return existingActiveWorkout;
  }

  const now = Date.now();

  const workout = createEmptyWorkout({
    id: createId("workout"),
    now,
  });

  await saveWorkoutAggregate(workout);

  return workout;
}
