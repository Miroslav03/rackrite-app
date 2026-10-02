import {
  competitionBench,
  competitionDeadlift,
  competitionSquat,
} from "@/domain/templates/editor/tests/templates.test.constants";
import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";
import { removeTemplateSet } from "@/domain/templates/editor/templates.useCases";
import {
  getExercisePickerExclusions,
  getModalContent,
  getModalOperation,
  TEMPLATE_EDITOR_VIEW,
} from "../templateEditor.viewState.utils";

it("describes saving edits and only shows progress for an edit save", () => {
  const template = createTemplate();
  const overlay = {
    type: "confirmationModal",
    confirmation: { action: "editTemplate" },
  } as const;

  expect(TEMPLATE_EDITOR_VIEW.edit).toEqual({
    screenTitle: "Edit Template",
    finishButtonTitle: "Save Changes",
    discardButtonTitle: "Cancel Editing",
  });
  expect(getModalContent(overlay, template)).toEqual({
    title: "SAVE CHANGES?",
    description: `Changes to ${template.template.name} will be saved to your template library.`,
    confirmLabel: "SAVE",
  });
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "editTemplate" },
    }),
  ).toEqual({ status: "pending", label: "SAVING..." });
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "createTemplate" },
    }),
  ).toEqual({ status: "idle" });
});

it("describes exercise removal and matches progress to the selected exercise", () => {
  const template = createTemplate();
  const entry = template.exercises[0];
  const overlay = {
    type: "dangerModal",
    confirmation: {
      action: "removeExercise",
      templateExerciseId: entry.templateExercise.id,
    },
  } as const;

  expect(getModalContent(overlay, template)?.description).toContain(
    `${entry.exercise.name} and all of its sets`,
  );
  expect(
    getModalContent(
      {
        ...overlay,
        confirmation: {
          action: "removeExercise",
          templateExerciseId: "missing",
        },
      },
      template,
    ),
  ).toBeNull();
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: {
        type: "removeExercise",
        templateExerciseId: entry.templateExercise.id,
      },
    }),
  ).toEqual({ status: "pending", label: "REMOVING..." });
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "removeExercise", templateExerciseId: "other" },
    }),
  ).toEqual({ status: "idle" });
});

it("describes creation and only shows progress for the creation operation", () => {
  const overlay = {
    type: "confirmationModal",
    confirmation: { action: "createTemplate" },
  } as const;
  const template = createTemplate();

  expect(getModalContent(overlay, template)).toEqual({
    title: "CREATE TEMPLATE?",
    description: `${template.template.name} will be saved to your template library.`,
    confirmLabel: "CREATE",
  });
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "createTemplate" },
    }),
  ).toEqual({ status: "pending", label: "CREATING..." });
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "addSet", templateExerciseId: "exercise" },
    }),
  ).toEqual({ status: "idle" });
});

it("excludes existing exercises and disables competition lifts after all three families", () => {
  const template = createTemplate("template", [
    competitionBench,
    competitionSquat,
    competitionDeadlift,
  ]);
  expect(getExercisePickerExclusions(template)).toEqual({
    excludedExerciseIds: [
      competitionBench.id,
      competitionSquat.id,
      competitionDeadlift.id,
    ],
    excludedKinds: ["competition_lift"],
  });
  expect(getExercisePickerExclusions(createTemplate()).excludedKinds).toEqual(
    [],
  );
});

it("explains that removing the final set also removes the exercise", () => {
  const template = createTemplate();
  const firstSet = template.exercises[0].sets[0].id;
  const lastSet = template.exercises[0].sets[1].id;
  const reduced = removeTemplateSet(template, { setId: firstSet, now: 2000 });
  expect(
    getModalContent(
      {
        type: "dangerModal",
        confirmation: { action: "removeSet", templateSetId: lastSet },
      },
      reduced,
    )?.description,
  ).toContain("also remove the exercise");
  expect(
    getModalContent(
      {
        type: "dangerModal",
        confirmation: { action: "removeSet", templateSetId: "missing" },
      },
      template,
    ),
  ).toBeNull();
});

it("shows deletion progress only for the confirmation's set", () => {
  const overlay = {
    type: "dangerModal",
    confirmation: { action: "removeSet", templateSetId: "one" },
  } as const;
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "removeSet", templateSetId: "two" },
    }),
  ).toEqual({ status: "idle" });
  expect(
    getModalOperation(overlay, {
      status: "pending",
      operation: { type: "removeSet", templateSetId: "one" },
    }),
  ).toEqual({ status: "pending", label: "REMOVING..." });
});
