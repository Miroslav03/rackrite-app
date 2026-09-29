import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";
import { createWorkoutFromTemplate } from "@/domain/workout/workout.useCases";
import { loadTemplateDetails } from "../loadTemplateDetails";

it("derives the saved template's details and latest completion timestamp", async () => {
  const template = createTemplate();
  let id = 0;
  const previous = createWorkoutFromTemplate(template, null, {
    id: "previous",
    now: 1000,
    createWorkoutExerciseId: () => `exercise_${id++}`,
    createWorkoutSetId: () => `set_${id++}`,
  });
  previous.workout.status = "completed";
  previous.workout.finishedAt = 2000;
  const details = await loadTemplateDetails(
    {
      templateRepository: { getTemplateAggregateById: async () => template },
      workoutRepository: {
        getLatestCompletedWorkoutForTemplate: async () => previous,
      },
    },
    template.template.id,
  );
  expect(details).toMatchObject({
    id: "template_1",
    totalSets: 4,
    lastExecution: { finishedAt: 2000 },
  });
});

it("returns null for a missing template without loading history", async () => {
  const getLatestCompletedWorkoutForTemplate = jest.fn(async () => null);
  expect(
    await loadTemplateDetails(
      {
        templateRepository: { getTemplateAggregateById: async () => null },
        workoutRepository: { getLatestCompletedWorkoutForTemplate },
      },
      "missing",
    ),
  ).toBeNull();
  expect(getLatestCompletedWorkoutForTemplate).not.toHaveBeenCalled();
});
