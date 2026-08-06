import {
  addWorkoutExercise,
  addWorkoutSet,
  clearWorkoutRestTimer,
  completeWorkoutSet,
  createEmptyWorkout,
  finishWorkout,
  removeWorkoutExercise,
  selectWorkoutSet,
  startWorkoutRestTimer,
  updateWorkoutExerciseRestSeconds,
  updateWorkoutSet,
} from "../workout.useCases";

import {
  barbellRow,
  closeGripBench,
  competitionBench,
  competitionDeadlift,
  competitionSquat,
  pausedBench,
} from "./workout.test.constants";
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
      restTimer: null,
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
        restSeconds: 180,
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
          restSeconds: 180,
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

  it("rejects a non-positive rest snapshot", () => {
    expect(() =>
      addWorkoutExercise(createEmptyWorkout({ id: "workout_1", now: 1000 }), {
        workoutExerciseId: "workout_exercise_1",
        setId: "set_1",
        exercise: competitionBench,
        restSeconds: 0,
        now: 2000,
      }),
    ).toThrow("Workout exercise rest duration must be a positive integer");
  });

  it("allows all three competition lifts when each uses a different family", () => {
    const workout = [
      competitionSquat,
      competitionBench,
      competitionDeadlift,
    ].reduce(
      (currentWorkout, exercise, index) =>
        addWorkoutExercise(currentWorkout, {
          workoutExerciseId: `workout_exercise_${index + 1}`,
          setId: `set_${index + 1}`,
          exercise,
          restSeconds: exercise.defaultRestSeconds ?? 90,
          now: 2000 + index,
        }),
      createEmptyWorkout({ id: "workout_1", now: 1000 }),
    );

    expect(workout.exercises.map(({ exercise }) => exercise.id)).toEqual([
      "competition_squat",
      "competition_bench",
      "competition_deadlift",
    ]);
  });

  it("rejects more than one competition lift from the same family", () => {
    const workout = addWorkoutExercise(
      createEmptyWorkout({ id: "workout_1", now: 1000 }),
      {
        workoutExerciseId: "workout_exercise_1",
        setId: "set_1",
        exercise: competitionBench,
        restSeconds: competitionBench.defaultRestSeconds ?? 90,
        now: 2000,
      },
    );

    expect(() =>
      addWorkoutExercise(workout, {
        workoutExerciseId: "workout_exercise_2",
        setId: "set_2",
        exercise: competitionBench,
        restSeconds: competitionBench.defaultRestSeconds ?? 90,
        now: 2001,
      }),
    ).toThrow(
      "Workout cannot contain more than one competition lift for the bench family",
    );
  });

  it("allows more than three exercises including multiple variations from the same family", () => {
    const workout = [
      competitionBench,
      pausedBench,
      closeGripBench,
      barbellRow,
    ].reduce(
      (currentWorkout, exercise, index) =>
        addWorkoutExercise(currentWorkout, {
          workoutExerciseId: `workout_exercise_${index + 1}`,
          setId: `set_${index + 1}`,
          exercise,
          restSeconds: exercise.defaultRestSeconds ?? 90,
          now: 2000 + index,
        }),
      createEmptyWorkout({ id: "workout_1", now: 1000 }),
    );

    expect(workout.exercises).toHaveLength(4);
  });
});

describe("removeWorkoutExercise", () => {
  it("removes the final exercise, its sets, and clears the active set", () => {
    const workout = createWorkoutWithCompetitionBench();

    const nextWorkout = removeWorkoutExercise(workout, {
      workoutExerciseId: "workout_exercise_1",
      now: 3000,
    });

    expect(nextWorkout.exercises).toEqual([]);
    expect(nextWorkout.workout.activeSetId).toBeNull();
    expect(nextWorkout.workout.updatedAt).toBe(3000);
  });

  it("selects an unfinished remaining set when the active exercise is removed", () => {
    const workout = addWorkoutExercise(createWorkoutWithCompetitionBench(), {
      workoutExerciseId: "workout_exercise_2",
      setId: "set_2",
      exercise: barbellRow,
      restSeconds: barbellRow.defaultRestSeconds ?? 90,
      now: 3000,
    });

    const nextWorkout = removeWorkoutExercise(workout, {
      workoutExerciseId: "workout_exercise_2",
      now: 4000,
    });

    expect(nextWorkout.exercises).toHaveLength(1);
    expect(nextWorkout.workout.activeSetId).toBe("set_1");
  });

  it("preserves the active set and reindexes exercises after a removal", () => {
    const workout = addWorkoutExercise(createWorkoutWithCompetitionBench(), {
      workoutExerciseId: "workout_exercise_2",
      setId: "set_2",
      exercise: barbellRow,
      restSeconds: barbellRow.defaultRestSeconds ?? 90,
      now: 3000,
    });

    const nextWorkout = removeWorkoutExercise(workout, {
      workoutExerciseId: "workout_exercise_1",
      now: 4000,
    });

    expect(nextWorkout.exercises).toHaveLength(1);
    expect(nextWorkout.exercises[0].workoutExercise).toMatchObject({
      id: "workout_exercise_2",
      orderIndex: 0,
      updatedAt: 4000,
    });
    expect(nextWorkout.workout.activeSetId).toBe("set_2");
  });

  it("throws when the workout exercise does not exist", () => {
    expect(() =>
      removeWorkoutExercise(createWorkoutWithCompetitionBench(), {
        workoutExerciseId: "missing_exercise",
        now: 3000,
      }),
    ).toThrow("Workout exercise not found");
  });
});

describe("updateWorkoutExerciseRestSeconds", () => {
  it("updates the rest snapshot for future timers", () => {
    const nextWorkoutAggregate = updateWorkoutExerciseRestSeconds(
      createWorkoutWithCompetitionBench(),
      {
        workoutExerciseId: "workout_exercise_1",
        restSeconds: 240,
        now: 3000,
      },
    );

    expect(nextWorkoutAggregate.exercises[0].workoutExercise.restSeconds).toBe(
      240,
    );
    expect(nextWorkoutAggregate.exercises[0].workoutExercise.updatedAt).toBe(
      3000,
    );
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("rejects a fractional rest duration", () => {
    expect(() =>
      updateWorkoutExerciseRestSeconds(createWorkoutWithCompetitionBench(), {
        workoutExerciseId: "workout_exercise_1",
        restSeconds: 90.5,
        now: 3000,
      }),
    ).toThrow("Workout exercise rest duration must be a positive integer");
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

describe("workout rest timer", () => {
  it("starts from the completed set exercise rest snapshot", () => {
    const nextWorkoutAggregate = startWorkoutRestTimer(
      createWorkoutWithCompletedFirstSet(),
      {
        setId: "set_1",
        now: 6000,
      },
    );

    expect(nextWorkoutAggregate.workout.restTimer).toEqual({
      startedAt: 6000,
      endsAt: 186000,
    });
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(6000);
  });

  it("does not start from an unfinished set", () => {
    expect(() =>
      startWorkoutRestTimer(createWorkoutWithCompetitionBench(), {
        setId: "set_1",
        now: 3000,
      }),
    ).toThrow("Rest timer can only start after a completed set");
  });

  it("clears a running timer", () => {
    const withTimer = startWorkoutRestTimer(
      createWorkoutWithCompletedFirstSet(),
      {
        setId: "set_1",
        now: 6000,
      },
    );
    const nextWorkoutAggregate = clearWorkoutRestTimer(withTimer, {
      now: 7000,
    });

    expect(nextWorkoutAggregate.workout.restTimer).toBeNull();
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(7000);
  });

  it("clears the previous timer when another set is completed", () => {
    const withTimer = startWorkoutRestTimer(
      createWorkoutWithCompletedFirstSet(),
      {
        setId: "set_1",
        now: 6000,
      },
    );
    const configuredSecondSet = updateWorkoutSet(withTimer, {
      setId: "set_2",
      weight: 100,
      reps: 5,
      now: 7000,
    });
    const nextWorkoutAggregate = completeWorkoutSet(configuredSecondSet, {
      setId: "set_2",
      now: 8000,
    });

    expect(nextWorkoutAggregate.workout.restTimer).toBeNull();
  });

  it("clears the timer when finishing the workout", () => {
    const withTimer = startWorkoutRestTimer(
      createWorkoutWithCompletedFirstSet(),
      {
        setId: "set_1",
        now: 6000,
      },
    );
    const finishedWorkout = finishWorkout(withTimer, { now: 7000 });

    expect(finishedWorkout.workout.restTimer).toBeNull();
  });
});
