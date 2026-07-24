import {
  completeWorkoutSet,
  createEmptyWorkout,
  updateWorkoutSet,
} from "@/domain/workout/workout.useCases";
import {
  createWorkoutWithCompetitionBench,
  createWorkoutWithTwoSets,
} from "@/domain/workout/tests/workout.test.helpers";

import {
  createActiveWorkoutTemplateCardViewModel,
  getActiveWorkoutFooterContent,
} from "./ActiveWorkoutTemplateCard.viewModel";

describe("createActiveWorkoutTemplateCardViewModel", () => {
  it("describes a new workout that needs its first set configured", () => {
    const workout = createEmptyWorkout({ id: "workout_1", now: 1_000 });

    expect(createActiveWorkoutTemplateCardViewModel(workout)).toEqual({
      status: "configure",
      workoutName: "Quick Workout",
      exerciseName: null,
      activeSetPosition: 0,
      totalSets: 0,
    });
  });

  it("derives the active exercise, set position and next-set values", () => {
    const workout = updateWorkoutSet(createWorkoutWithTwoSets(), {
      setId: "set_2",
      weight: 100,
      reps: 5,
      rpe: 8,
      now: 4_000,
    });
    const viewModel = createActiveWorkoutTemplateCardViewModel(workout);

    expect(viewModel).toEqual({
      status: "nextSet",
      workoutName: "Quick Workout",
      exerciseName: "Competition Bench",
      activeSetPosition: 2,
      totalSets: 2,
      nextSet: {
        weight: 100,
        reps: 5,
        rpe: 8,
      },
    });
    expect(getActiveWorkoutFooterContent(viewModel)).toEqual({
      label: "Next Set",
      value: "100 KG × 5 · RPE 8",
    });
  });

  it("describes an active workout whose sets are all complete", () => {
    const configuredWorkout = updateWorkoutSet(
      createWorkoutWithCompetitionBench(),
      {
        setId: "set_1",
        weight: 100,
        reps: 5,
        now: 4_000,
      },
    );
    const completedSets = completeWorkoutSet(configuredWorkout, {
      setId: "set_1",
      now: 5_000,
    });

    expect(createActiveWorkoutTemplateCardViewModel(completedSets)).toEqual({
      status: "complete",
      workoutName: "Quick Workout",
      exerciseName: "Competition Bench",
      activeSetPosition: 1,
      totalSets: 1,
    });
  });
});
