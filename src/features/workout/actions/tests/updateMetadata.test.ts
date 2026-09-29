import { createWorkoutWithTwoSets } from "@/domain/workout/tests/workout.test.helpers";
import { updateMetadata } from "../updateMetadata";

it("persists metadata through the aggregate repository", async () => {
  const source = createWorkoutWithTwoSets();
  const updateWorkoutAggregate = jest.fn().mockResolvedValue(undefined);
  const updated = await updateMetadata(
    { repository: { updateWorkoutAggregate }, now: () => 9000 },
    source,
    { description: "  Heavy day  " },
  );
  expect(updated.workout.description).toBe("Heavy day");
  expect(updateWorkoutAggregate).toHaveBeenCalledWith(source, updated);
  expect(updated.exercises).toBe(source.exercises);
});

it("propagates persistence failure without modifying the source", async () => {
  const source = createWorkoutWithTwoSets();
  const error = new Error("Database unavailable");
  await expect(
    updateMetadata(
      {
        repository: {
          updateWorkoutAggregate: jest.fn().mockRejectedValue(error),
        },
        now: () => 9000,
      },
      source,
      { description: "Unsaved" },
    ),
  ).rejects.toBe(error);
  expect(source.workout.description).toBeNull();
});
