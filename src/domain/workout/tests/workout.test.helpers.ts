import {
  addWorkoutExercise,
  addWorkoutSet,
  completeWorkoutSet,
  createEmptyWorkout,
  finishWorkout,
  updateWorkoutSet,
} from "../workout.useCases";

import { barbellRow, competitionBench } from "./workout.test.constants";

export function createWorkoutWithCompetitionBench() {
  return addWorkoutExercise(
    createEmptyWorkout({ id: "workout_1", now: 1000 }),
    {
      workoutExerciseId: "workout_exercise_1",
      setId: "set_1",
      exercise: competitionBench,
      restSeconds: 180,
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

export function createWorkoutWithTwoExercises() {
  return addWorkoutExercise(createWorkoutWithCompetitionBench(), {
    workoutExerciseId: "workout_exercise_2",
    setId: "set_2",
    exercise: barbellRow,
    restSeconds: barbellRow.defaultRestSeconds ?? 90,
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

export function createWorkoutWithAllSetsCompleted() {
  const withUpdatedSecondSet = updateWorkoutSet(
    createWorkoutWithCompletedFirstSet(),
    {
      setId: "set_2",
      weight: 90,
      reps: 6,
      now: 6000,
    },
  );

  return completeWorkoutSet(withUpdatedSecondSet, {
    setId: "set_2",
    now: 7000,
  });
}

export function createCompletedWorkoutWithMixedSets() {
  const source = createWorkoutWithTwoExercises();
  const first = source.exercises[0];
  const base = first.sets[0];
  source.workout.sourceTemplateId = "template_1";
  source.exercises[0] = {
    ...first,
    workoutExercise: {
      ...first.workoutExercise,
      notes: "Pause each rep",
      restSeconds: 240,
    },
    sets: [
      {
        ...base,
        id: "warmup",
        setIndex: 0,
        type: "warmup",
        weight: 0,
        reps: 5,
        rpe: 10,
        finishedAt: 4000,
      },
      {
        ...base,
        id: "skipped",
        setIndex: 1,
        type: "working",
        weight: 200,
        reps: 10,
        rpe: 10,
      },
      {
        ...base,
        id: "working",
        setIndex: 2,
        type: "working",
        weight: 80,
        reps: 5,
        rpe: 8,
        finishedAt: 5000,
      },
      {
        ...base,
        id: "top",
        setIndex: 3,
        type: "top",
        weight: 100,
        reps: 3,
        rpe: 9,
        finishedAt: 6000,
      },
      {
        ...base,
        id: "backoff",
        setIndex: 4,
        type: "backoff",
        weight: 70,
        reps: 5,
        rpe: null,
        finishedAt: 7000,
      },
    ],
  };
  source.exercises = source.exercises
    .reverse()
    .map((exercise, orderIndex) => ({
      ...exercise,
      workoutExercise: { ...exercise.workoutExercise, orderIndex },
    }));
  return finishWorkout(source, { now: 181000, skipUnfinishedSets: true });
}
