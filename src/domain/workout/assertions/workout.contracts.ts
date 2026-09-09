import {
  WorkoutAggregate,
  WorkoutExerciseAggregate,
  WorkoutSet,
} from "../workout.types";

// Depending on buisness rules this can change later if we start editing workouts in history
export function assertWorkoutIsActive(
  workoutAggregate: WorkoutAggregate,
): void {
  if (workoutAggregate.workout.status !== "active") {
    throw new Error("Workout must be active");
  }
}

export function assertWorkoutIsCompleted(
  workoutAggregate: WorkoutAggregate,
): asserts workoutAggregate is WorkoutAggregate & {
  workout: { status: "completed"; finishedAt: number };
} {
  const { workout } = workoutAggregate;
  if (workout.status !== "completed" || workout.finishedAt === null) {
    throw new Error("History requires a completed workout with a finish time");
  }
}

export function assertWorkoutExerciseExists(
  exercise: WorkoutExerciseAggregate | undefined,
): asserts exercise is WorkoutExerciseAggregate {
  if (!exercise) {
    throw new Error("Workout exercise not found");
  }
}

export function assertWorkoutSetExists(
  set: WorkoutSet | undefined,
): asserts set is WorkoutSet {
  if (!set) {
    throw new Error("Workout set not found");
  }
}
