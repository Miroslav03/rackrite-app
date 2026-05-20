import {
  addWorkoutSection,
  addWorkoutSet,
  createEmptyWorkout,
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
