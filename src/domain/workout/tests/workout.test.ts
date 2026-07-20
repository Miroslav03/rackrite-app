import {
  addWorkoutExercise,
  addWorkoutSet,
  completeWorkoutSet,
  createEmptyWorkout,
  finishWorkout,
  selectWorkoutSet,
  updateWorkoutSet,
} from "../workout.useCases";

import { competitionBench } from "./workout.test.constants";
import {
  createWorkoutWithCompetitionBench,
  createWorkoutWithCompletedFirstSet,
  createWorkoutWithTwoSets,
  createWorkoutWithUpdatedFirstSet,
} from "./workout.test.helpers";

describe("createEmptyWorkout", () => {
  it("creates an active empty workout", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(workoutAggregate.workout).toEqual({
      id: "workout_1",
      sourceTemplateId: null,
      status: "active",
      activeSetId: null,
      startedAt: 1000,
      finishedAt: null,
      createdAt: 1000,
      updatedAt: 1000,
    });
    expect(workoutAggregate.exercises).toEqual([]);
  });
});

describe("addWorkoutExercise", () => {
  it("adds Competition Bench with an initial active working set", () => {
    const nextWorkoutAggregate = addWorkoutExercise(
      createEmptyWorkout({ id: "workout_1", now: 1000 }),
      {
        workoutExerciseId: "workout_exercise_1",
        setId: "set_1",
        exercise: competitionBench,
        now: 2000,
      },
    );

    expect(nextWorkoutAggregate.exercises).toEqual([
      {
        workoutExercise: {
          id: "workout_exercise_1",
          workoutId: "workout_1",
          exerciseId: "competition_bench",
          notes: null,
          orderIndex: 0,
          createdAt: 2000,
          updatedAt: 2000,
        },
        exercise: competitionBench,
        sets: [
          {
            id: "set_1",
            workoutExerciseId: "workout_exercise_1",
            setIndex: 0,
            type: "working",
            weight: null,
            reps: null,
            rpe: null,
            finishedAt: null,
            createdAt: 2000,
            updatedAt: 2000,
          },
        ],
      },
    ]);
    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_1");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(2000);
  });
});

describe("addWorkoutSet", () => {
  it("adds a new set to an existing exercise and makes it active", () => {
    const nextWorkoutAggregate = addWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        workoutExerciseId: "workout_exercise_1",
        setId: "set_2",
        now: 3000,
      },
    );
    const exerciseAggregate = nextWorkoutAggregate.exercises[0];

    expect(exerciseAggregate.workoutExercise.updatedAt).toBe(3000);
    expect(exerciseAggregate.sets).toHaveLength(2);
    expect(exerciseAggregate.sets[1]).toEqual({
      id: "set_2",
      workoutExerciseId: "workout_exercise_1",
      setIndex: 1,
      type: "working",
      weight: null,
      reps: null,
      rpe: null,
      finishedAt: null,
      createdAt: 3000,
      updatedAt: 3000,
    });
    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_2");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("throws when the workout exercise does not exist", () => {
    expect(() =>
      addWorkoutSet(
        createEmptyWorkout({
          id: "workout_1",
          now: 1000,
        }),
        {
          workoutExerciseId: "missing_exercise",
          setId: "set_1",
          now: 2000,
        },
      ),
    ).toThrow("Workout exercise not found");
  });
});

describe("updateWorkoutSet", () => {
  it("updates weight and reps for an existing set", () => {
    const nextWorkoutAggregate = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        weight: 100,
        reps: 5,
        now: 3000,
      },
    );
    const updatedSet = nextWorkoutAggregate.exercises[0].sets[0];

    expect(updatedSet).toMatchObject({
      id: "set_1",
      setIndex: 0,
      type: "working",
      weight: 100,
      reps: 5,
      updatedAt: 3000,
    });
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("updates set type", () => {
    const nextWorkoutAggregate = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        type: "top",
        now: 3000,
      },
    );

    expect(nextWorkoutAggregate.exercises[0].sets[0].type).toBe("top");
    expect(nextWorkoutAggregate.exercises[0].sets[0].updatedAt).toBe(3000);
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("updates rpe", () => {
    const nextWorkoutAggregate = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        rpe: 6,
        now: 3000,
      },
    );

    expect(nextWorkoutAggregate.exercises[0].sets[0].rpe).toBe(6);
    expect(nextWorkoutAggregate.exercises[0].sets[0].updatedAt).toBe(3000);
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("throws when the set does not exist", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(() =>
      updateWorkoutSet(workoutAggregate, {
        setId: "missing_set",
        weight: 100,
        reps: 5,
        now: 2000,
      }),
    ).toThrow("Workout set not found");
  });

  it("throws when reps are zero", () => {
    expect(() =>
      updateWorkoutSet(createWorkoutWithCompetitionBench(), {
        setId: "set_1",
        reps: 0,
        now: 3000,
      }),
    ).toThrow("Reps must be a positive number");
  });

  it("throws when weight is negative", () => {
    expect(() =>
      updateWorkoutSet(createWorkoutWithCompetitionBench(), {
        setId: "set_1",
        weight: -1,
        now: 3000,
      }),
    ).toThrow("Weight cannot be a negative number");
  });

  it("throws when rpe is outside the valid range", () => {
    expect(() =>
      updateWorkoutSet(createWorkoutWithCompetitionBench(), {
        setId: "set_1",
        rpe: 11,
        now: 3000,
      }),
    ).toThrow("RPE must be between 1 and 10");
  });
});

describe("selectWorkoutSet", () => {
  it("selects an existing workout set as the active set", () => {
    const nextWorkoutAggregate = selectWorkoutSet(createWorkoutWithTwoSets(), {
      setId: "set_1",
      now: 4000,
    });

    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_1");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(4000);
  });

  it("throws when the set does not exist", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(() =>
      selectWorkoutSet(workoutAggregate, {
        setId: "missing_set",
        now: 2000,
      }),
    ).toThrow("Workout set not found");
  });
});

describe("completeWorkoutSet", () => {
  it("marks a set as finished and selects the next unfinished set", () => {
    const nextWorkoutAggregate = completeWorkoutSet(
      createWorkoutWithUpdatedFirstSet(),
      {
        setId: "set_1",
        now: 5000,
      },
    );
    const firstSet = nextWorkoutAggregate.exercises[0].sets[0];

    expect(firstSet.finishedAt).toBe(5000);
    expect(firstSet.updatedAt).toBe(5000);
    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_2");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(5000);
  });

  it("keeps the last set active when all sets are finished", () => {
    const withUpdatedSet = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        weight: 100,
        reps: 5,
        now: 3000,
      },
    );
    const nextWorkoutAggregate = completeWorkoutSet(withUpdatedSet, {
      setId: "set_1",
      now: 4000,
    });

    expect(nextWorkoutAggregate.exercises[0].sets[0].finishedAt).toBe(4000);
    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_1");
  });

  it("throws when the set does not exist", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(() =>
      completeWorkoutSet(workoutAggregate, {
        setId: "missing_set",
        now: 4000,
      }),
    ).toThrow("Workout set not found");
  });

  it("throws when the set has no weight", () => {
    const withRepsOnly = updateWorkoutSet(createWorkoutWithCompetitionBench(), {
      setId: "set_1",
      reps: 5,
      now: 3000,
    });

    expect(() =>
      completeWorkoutSet(withRepsOnly, {
        setId: "set_1",
        now: 4000,
      }),
    ).toThrow("Set must have weight before it can be completed");
  });

  it("throws when the set has no reps", () => {
    const withWeightOnly = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        weight: 100,
        now: 3000,
      },
    );

    expect(() =>
      completeWorkoutSet(withWeightOnly, {
        setId: "set_1",
        now: 4000,
      }),
    ).toThrow("Set must have reps before it can be completed");
  });
});

describe("finishWorkout", () => {
  it("marks an active workout as completed", () => {
    const finishedWorkout = finishWorkout(
      createWorkoutWithCompletedFirstSet(),
      { now: 6000 },
    );

    expect(finishedWorkout.workout.status).toBe("completed");
    expect(finishedWorkout.workout.finishedAt).toBe(6000);
    expect(finishedWorkout.workout.updatedAt).toBe(6000);
  });

  it("throws when finishing an already completed workout", () => {
    const finishedWorkout = finishWorkout(
      createWorkoutWithCompletedFirstSet(),
      { now: 6000 },
    );

    expect(() => finishWorkout(finishedWorkout, { now: 7000 })).toThrow(
      "Workout must be active",
    );
  });

  it("throws when the workout has no completed sets", () => {
    expect(() =>
      finishWorkout(createWorkoutWithCompetitionBench(), { now: 3000 }),
    ).toThrow("Workout must have at least one completed set");
  });

  it("allows finishing a workout when some sets are unfinished", () => {
    const finishedWorkout = finishWorkout(
      createWorkoutWithCompletedFirstSet(),
      { now: 6000 },
    );

    expect(finishedWorkout.workout.status).toBe("completed");
    expect(finishedWorkout.exercises[0].sets[0].finishedAt).toBe(5000);
    expect(finishedWorkout.exercises[0].sets[1].finishedAt).toBeNull();
  });
});
