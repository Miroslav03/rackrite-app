import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";
import { startWorkoutFromTemplate } from "../startWorkoutFromTemplate";

function dependencies() {
  let id = 0;
  return {
    templateRepository: {
      getTemplateAggregateById: jest.fn(async () => createTemplate()),
    },
    repository: {
      getLatestCompletedWorkoutForTemplate: jest.fn(async () => null),
      startWorkoutAggregate: jest.fn(async () => {}),
    },
    now: () => 5000,
    createWorkoutId: () => "new",
    createWorkoutExerciseId: () => `exercise_${id++}`,
    createWorkoutSetId: () => `set_${id++}`,
  };
}

it.each([null, "active"])(
  "reloads current template data and persists with expected active ID %s",
  async (expectedActiveWorkoutId) => {
    const deps = dependencies();
    const result = await startWorkoutFromTemplate(deps, {
      templateId: "template_1",
      expectedActiveWorkoutId,
    });
    expect(
      deps.templateRepository.getTemplateAggregateById,
    ).toHaveBeenCalledWith("template_1");
    expect(
      deps.repository.getLatestCompletedWorkoutForTemplate,
    ).toHaveBeenCalledWith("template_1");
    expect(deps.repository.startWorkoutAggregate).toHaveBeenCalledWith(
      result,
      expectedActiveWorkoutId,
    );
  },
);

it("does not start when the template was deleted", async () => {
  const deps = dependencies();
  const missing = {
    ...deps,
    templateRepository: { getTemplateAggregateById: jest.fn(async () => null) },
  };
  await expect(
    startWorkoutFromTemplate(missing, {
      templateId: "missing",
      expectedActiveWorkoutId: "active",
    }),
  ).rejects.toThrow("no longer available");
  expect(deps.repository.startWorkoutAggregate).not.toHaveBeenCalled();
});

it("propagates a persistence failure without returning an unpersisted workout", async () => {
  const deps = dependencies();
  deps.repository.startWorkoutAggregate.mockRejectedValueOnce(
    new Error("Write failed"),
  );
  await expect(
    startWorkoutFromTemplate(deps, {
      templateId: "template_1",
      expectedActiveWorkoutId: "active",
    }),
  ).rejects.toThrow("Write failed");
});
