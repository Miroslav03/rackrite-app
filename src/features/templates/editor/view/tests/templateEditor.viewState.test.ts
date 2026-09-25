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
} from "../templateEditor.viewState.utils";

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
