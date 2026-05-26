import {
  addWorkoutSection,
  addWorkoutSet,
  completeWorkoutSet,
  createEmptyWorkout,
  finishWorkout,
  selectWorkoutSet,
  updateWorkoutSet,
} from "./workout.useCases";

describe("createEmptyWorkout", () => {
  it("creates an active empty workout", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(workoutAggregate.workout.id).toBe("workout_1");
    expect(workoutAggregate.workout.status).toBe("active");
    expect(workoutAggregate.workout.sourceTemplateId).toBeNull();
    expect(workoutAggregate.workout.activeSetId).toBe(null);
    expect(workoutAggregate.workout.startedAt).toBe(1000);
    expect(workoutAggregate.workout.finishedAt).toBeNull();
    expect(workoutAggregate.workout.createdAt).toBe(1000);
    expect(workoutAggregate.workout.updatedAt).toBe(1000);

    expect(workoutAggregate.sections).toEqual([]);
  });
});

describe("addWorkoutSection", () => {
  it("adds a bench section with one inital active set", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const nextWorkoutAggregate = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    expect(nextWorkoutAggregate.sections).toHaveLength(1);

    const sectionWorkoutAggregate = nextWorkoutAggregate.sections[0];

    expect(sectionWorkoutAggregate.section.id).toBe("section_1");
    expect(sectionWorkoutAggregate.section.workoutId).toBe("workout_1");
    expect(sectionWorkoutAggregate.section.variationId).toBe(
      "competition_bench",
    );
    expect(sectionWorkoutAggregate.section.liftFamily).toBe("bench");
    expect(sectionWorkoutAggregate.section.notes).toBeNull();
    expect(sectionWorkoutAggregate.section.orderIndex).toBe(0);
    expect(sectionWorkoutAggregate.section.createdAt).toBe(2000);
    expect(sectionWorkoutAggregate.section.updatedAt).toBe(2000);

    expect(sectionWorkoutAggregate.sets).toHaveLength(1);

    const firstSet = sectionWorkoutAggregate.sets[0];

    expect(firstSet.id).toBe("set_1");
    expect(firstSet.workoutSectionId).toBe("section_1");
    expect(firstSet.setIndex).toBe(0);
    expect(firstSet.type).toBe("working");
    expect(firstSet.weight).toBeNull();
    expect(firstSet.reps).toBeNull();
    expect(firstSet.finishedAt).toBeNull();
    expect(firstSet.createdAt).toBe(2000);
    expect(firstSet.updatedAt).toBe(2000);

    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_1");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(2000);
  });
});

describe("addWorkoutSet", () => {
  it("adds a new set to an existing section and makes it active", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const nextWorkoutAggregate = addWorkoutSet(workoutAggregateWithBench, {
      sectionId: "section_1",
      setId: "set_2",
      now: 3000,
    });

    expect(nextWorkoutAggregate.sections).toHaveLength(1);

    const sectionAggregate = nextWorkoutAggregate.sections[0];

    expect(sectionAggregate.section.updatedAt).toBe(3000);
    expect(sectionAggregate.sets).toHaveLength(2);

    const newSet = sectionAggregate.sets[1];

    expect(newSet.id).toBe("set_2");
    expect(newSet.workoutSectionId).toBe("section_1");
    expect(newSet.setIndex).toBe(1);
    expect(newSet.type).toBe("working");
    expect(newSet.weight).toBeNull();
    expect(newSet.reps).toBeNull();
    expect(newSet.rpe).toBeNull();
    expect(newSet.finishedAt).toBeNull();
    expect(newSet.createdAt).toBe(3000);
    expect(newSet.updatedAt).toBe(3000);

    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_2");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("throws when the section does not exist", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(() =>
      addWorkoutSet(workoutAggregate, {
        sectionId: "missing_section",
        setId: "set_1",
        now: 2000,
      }),
    ).toThrow("Workout section not found");
  });
});

describe("updateWorkoutSet", () => {
  it("updates weight and reps for an existing set", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const workoutAggregateUpdatedSet = updateWorkoutSet(
      workoutAggregateWithBench,
      {
        setId: "set_1",
        weight: 100,
        reps: 5,
        now: 3000,
      },
    );

    const updatedSet = workoutAggregateUpdatedSet.sections[0].sets[0];

    expect(updatedSet.id).toBe("set_1");
    expect(updatedSet.setIndex).toBe(0);
    expect(updatedSet.type).toBe("working");
    expect(updatedSet.weight).toBe(100);
    expect(updatedSet.reps).toBe(5);
    expect(updatedSet.updatedAt).toBe(3000);

    expect(workoutAggregateUpdatedSet.workout.updatedAt).toBe(3000);
  });

  it("updates set type", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const nextWorkoutAggregate = updateWorkoutSet(workoutAggregateWithBench, {
      setId: "set_1",
      type: "top",
      now: 3000,
    });

    const updatedSet = nextWorkoutAggregate.sections[0].sets[0];

    expect(updatedSet.type).toBe("top");
    expect(updatedSet.updatedAt).toBe(3000);

    expect(nextWorkoutAggregate.workout.updatedAt).toBe(3000);
  });

  it("updates rpe", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const nextWorkoutAggregate = updateWorkoutSet(workoutAggregateWithBench, {
      setId: "set_1",
      rpe: 6,
      now: 3000,
    });

    const updatedSet = nextWorkoutAggregate.sections[0].sets[0];

    expect(updatedSet.rpe).toBe(6);
    expect(updatedSet.updatedAt).toBe(3000);

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
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    expect(() =>
      updateWorkoutSet(workoutAggregateWithBench, {
        setId: "set_1",
        reps: 0,
        now: 3000,
      }),
    ).toThrow("Reps must be a positive number");
  });

  it("throws when weight is negative", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    expect(() =>
      updateWorkoutSet(workoutAggregateWithBench, {
        setId: "set_1",
        weight: -1,
        now: 3000,
      }),
    ).toThrow("Weight cannot be a negative number");
  });

  it("throws when rpe is outside the valid range", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const workoutAggregateWithBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    expect(() =>
      updateWorkoutSet(workoutAggregateWithBench, {
        setId: "set_1",
        rpe: 11,
        now: 3000,
      }),
    ).toThrow("RPE must be between 1 and 10");
  });
});

describe("selectWorkoutSet", () => {
  it("selects an existing workout set as the active set", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withSecondSet = addWorkoutSet(withBench, {
      sectionId: "section_1",
      setId: "set_2",
      now: 3000,
    });

    const nextWorkoutAggregate = selectWorkoutSet(withSecondSet, {
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
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withSecondSet = addWorkoutSet(withBench, {
      sectionId: "section_1",
      setId: "set_2",
      now: 2500,
    });

    const withUpdatedFirstSet = updateWorkoutSet(withSecondSet, {
      setId: "set_1",
      weight: 100,
      reps: 5,
      now: 3000,
    });

    const nextWorkoutAggregate = completeWorkoutSet(withUpdatedFirstSet, {
      setId: "set_1",
      now: 4000,
    });

    const firstSet = nextWorkoutAggregate.sections[0].sets[0];

    expect(firstSet.finishedAt).toBe(4000);
    expect(firstSet.updatedAt).toBe(4000);

    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_2");
    expect(nextWorkoutAggregate.workout.updatedAt).toBe(4000);
  });

  it("keeps the last set active when all sets are finished", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withUpdatedSet = updateWorkoutSet(withBench, {
      setId: "set_1",
      weight: 100,
      reps: 5,
      now: 3000,
    });

    const nextWorkoutAggregate = completeWorkoutSet(withUpdatedSet, {
      setId: "set_1",
      now: 4000,
    });

    const firstSet = nextWorkoutAggregate.sections[0].sets[0];

    expect(firstSet.finishedAt).toBe(4000);
    expect(nextWorkoutAggregate.workout.activeSetId).toBe("set_1");
  });

  it("throws when the set does not exist", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    expect(() =>
      completeWorkoutSet(workoutAggregate, {
        setId: "set_1",
        now: 4000,
      }),
    ).toThrow("Workout set not found");
  });

  it("throws when the set has no weight", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withRepsOnly = updateWorkoutSet(withBench, {
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
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withWeightOnly = updateWorkoutSet(withBench, {
      setId: "set_1",
      weight: 100,
      now: 3000,
    });

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
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withUpdatedSet = updateWorkoutSet(withBench, {
      setId: "set_1",
      weight: 100,
      reps: 5,
      now: 3000,
    });

    const withCompletedSet = completeWorkoutSet(withUpdatedSet, {
      setId: "set_1",
      now: 4000,
    });

    const finishedWorkout = finishWorkout(withCompletedSet, {
      now: 5000,
    });

    expect(finishedWorkout.workout.status).toBe("completed");
    expect(finishedWorkout.workout.finishedAt).toBe(5000);
    expect(finishedWorkout.workout.updatedAt).toBe(5000);
  });

  it("throws when finishing an already completed workout", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withUpdatedSet = updateWorkoutSet(withBench, {
      setId: "set_1",
      weight: 100,
      reps: 5,
      now: 3000,
    });

    const withCompletedSet = completeWorkoutSet(withUpdatedSet, {
      setId: "set_1",
      now: 4000,
    });

    const finishedWorkout = finishWorkout(withCompletedSet, {
      now: 5000,
    });

    expect(() =>
      finishWorkout(finishedWorkout, {
        now: 6000,
      }),
    ).toThrow("Workout must be active");
  });

  it("throws when the workout has no completed sets", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    expect(() =>
      finishWorkout(withBench, {
        now: 3000,
      }),
    ).toThrow("Workout must have at least one completed set");
  });

  it("allows finishing a workout even when some sets are unfinished", () => {
    const workoutAggregate = createEmptyWorkout({
      id: "workout_1",
      now: 1000,
    });

    const withBench = addWorkoutSection(workoutAggregate, {
      sectionId: "section_1",
      setId: "set_1",
      liftFamily: "bench",
      variationId: "competition_bench",
      now: 2000,
    });

    const withSecondSet = addWorkoutSet(withBench, {
      sectionId: "section_1",
      setId: "set_2",
      now: 2500,
    });

    const withUpdatedFirstSet = updateWorkoutSet(withSecondSet, {
      setId: "set_1",
      weight: 100,
      reps: 5,
      now: 3000,
    });

    const withCompletedFirstSet = completeWorkoutSet(withUpdatedFirstSet, {
      setId: "set_1",
      now: 4000,
    });

    const finishedWorkout = finishWorkout(withCompletedFirstSet, {
      now: 5000,
    });

    expect(finishedWorkout.workout.status).toBe("completed");
    expect(finishedWorkout.sections[0].sets[0].finishedAt).toBe(4000);
    expect(finishedWorkout.sections[0].sets[1].finishedAt).toBeNull();
  });
});

//First vertical slice
// Create Workout => Add Section => Add Set => Update Set => Complete Set => Finish Workout

//Delete a Workout set
