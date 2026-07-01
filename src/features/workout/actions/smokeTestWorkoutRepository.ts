import {
    getWorkoutAggregateById,
    saveWorkoutAggregate,
} from "@/data/repositories/workoutRepository";

import {
    addWorkoutSection,
    createEmptyWorkout,
    updateWorkoutSet,
} from "@/domain/workout/workout.useCases";

export async function smokeTestWorkoutRepository() {
  const workout = createEmptyWorkout({
    id: "workout_repo_test_1",
    now: 1000,
  });

  const withBench = addWorkoutSection(workout, {
    sectionId: "section_repo_test_1",
    setId: "set_repo_test_1",
    liftFamily: "bench",
    variationId: "competition_bench",
    now: 2000,
  });

  const updated = updateWorkoutSet(withBench, {
    setId: "set_repo_test_1",
    weight: 100,
    reps: 5,
    rpe: 8,
    now: 3000,
  });

  await saveWorkoutAggregate(updated);

  const loaded = await getWorkoutAggregateById(updated.workout.id);

  if (JSON.stringify(loaded) !== JSON.stringify(updated)) {
    console.log("Expected:", JSON.stringify(updated, null, 2));
    console.log("Loaded:", JSON.stringify(loaded, null, 2));
    throw new Error("Workout repository save/load smoke test failed");
  }

  console.log("Workout repository save/load smoke test passed");
}
