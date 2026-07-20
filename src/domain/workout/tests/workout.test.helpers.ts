import {
  addWorkoutExercise,
  addWorkoutSet,
  completeWorkoutSet,
  createEmptyWorkout,
  updateWorkoutSet,
} from "../workout.useCases";

import { competitionBench } from "./workout.test.constants";

export function createWorkoutWithCompetitionBench() {
  return addWorkoutExercise(
    createEmptyWorkout({ id: "workout_1", now: 1000 }),
    {
      workoutExerciseId: "workout_exercise_1",
      setId: "set_1",
      exercise: competitionBench,
      now: 2000,
    },
  );
}

export function createWorkoutWithTwoSets() {
  return addWorkoutSet(createWorkoutWithCompetitionBench(), {
    workoutExerciseId: "workout_exercise_1",
    setId: "set_2",
    now: 3000,
  });
}

export function createWorkoutWithUpdatedFirstSet() {
  return updateWorkoutSet(createWorkoutWithTwoSets(), {
    setId: "set_1",
    weight: 100,
    reps: 5,
    now: 4000,
  });
}

export function createWorkoutWithCompletedFirstSet() {
  return completeWorkoutSet(createWorkoutWithUpdatedFirstSet(), {
    setId: "set_1",
    now: 5000,
  });
}
