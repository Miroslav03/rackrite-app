import { getWorkoutFinishEligibility } from "../workout.selectors";
import {
    addWorkoutSet,
    createEmptyWorkout,
    updateWorkoutSet,
} from "../workout.useCases";

import {
    createWorkoutWithAllSetsCompleted,
    createWorkoutWithCompetitionBench,
    createWorkoutWithCompletedFirstSet,
} from "./workout.test.helpers";

describe("getWorkoutFinishEligibility", () => {
  it("blocks an empty workout", () => {
    const workout = createEmptyWorkout({ id: "workout_1", now: 1_000 });

    expect(getWorkoutFinishEligibility(workout)).toEqual({
      status: "blocked",
      reason: "noCompletedSets",
    });
  });

  it("blocks a workout whose sets have values but were not completed", () => {
    const workout = updateWorkoutSet(createWorkoutWithCompetitionBench(), {
      setId: "set_1",
      weight: 100,
      reps: 5,
      rpe: 8,
      now: 3_000,
    });

    expect(getWorkoutFinishEligibility(workout)).toEqual({
      status: "blocked",
      reason: "noCompletedSets",
    });
  });

  it("reports the number of unfinished sets in a partial workout", () => {
    const workout = addWorkoutSet(createWorkoutWithCompletedFirstSet(), {
      workoutExerciseId: "workout_exercise_1",
      setId: "set_3",
      now: 6_000,
    });

    expect(getWorkoutFinishEligibility(workout)).toEqual({
      status: "eligible",
      unfinishedSetCount: 2,
    });
  });

  it("reports no unfinished sets when every set is completed", () => {
    expect(
      getWorkoutFinishEligibility(createWorkoutWithAllSetsCompleted()),
    ).toEqual({
      status: "eligible",
      unfinishedSetCount: 0,
    });
  });
});
