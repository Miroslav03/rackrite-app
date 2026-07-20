import type {
  WorkoutAggregate,
  WorkoutExerciseAggregate,
  WorkoutExerciseId,
  WorkoutSet,
  WorkoutSetId,
} from "./workout.types";

export function getAllWorkoutSets(
  workoutAggregate: WorkoutAggregate,
): WorkoutSet[] {
  return workoutAggregate.exercises.flatMap(
    (exerciseAggregate) => exerciseAggregate.sets,
  );
}

export function getWorkoutExerciseById(
  workoutAggregate: WorkoutAggregate,
  workoutExerciseId: WorkoutExerciseId,
): WorkoutExerciseAggregate | undefined {
  return workoutAggregate.exercises.find(
    (exerciseAggregate) =>
      exerciseAggregate.workoutExercise.id === workoutExerciseId,
  );
}

export function getWorkoutSetById(
  workoutAggregate: WorkoutAggregate,
  setId: WorkoutSetId,
): WorkoutSet | undefined {
  return getAllWorkoutSets(workoutAggregate).find((set) => set.id === setId);
}
