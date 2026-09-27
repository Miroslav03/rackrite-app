import {
  createTemplate,
  freezeTemplate,
} from "@/domain/templates/editor/tests/templates.test.helpers";
import {
  removeTemplateSet,
  updateTemplateSet,
} from "@/domain/templates/editor/templates.useCases";
import { templatesSessionReducer as reduce } from "../templatesSession.reducer";
import type { TemplateSessionState } from "../templatesSession.types";

const template = freezeTemplate(createTemplate());
const setId = template.exercises[0].sets[0].id;
const createState: TemplateSessionState = {
  status: "create",
  activeSetId: null,
  activeTemplate: template,
  operation: { status: "idle" },
};

it("initializes create and edit sessions without a selected set", () => {
  expect(
    reduce({ status: "loading" }, { type: "creationSucceeded", template }),
  ).toEqual(createState);
  expect(
    reduce({ status: "loading" }, { type: "editingSucceeded", template }),
  ).toEqual({ ...createState, status: "edit", originalTemplate: template });
});

it("selects only existing sets and allows clearing selection", () => {
  expect(
    reduce(createState, { type: "setSelected", templateSetId: "missing" }),
  ).toBe(createState);
  const selected = reduce(createState, {
    type: "setSelected",
    templateSetId: setId,
  });
  expect(selected).toMatchObject({ activeSetId: setId });
  expect(
    reduce(selected, { type: "setSelected", templateSetId: null }),
  ).toMatchObject({ activeSetId: null });
});

it("preserves the original edit aggregate and clears selection when its set is deleted", () => {
  const state: TemplateSessionState = {
    ...createState,
    status: "edit",
    originalTemplate: template,
    activeSetId: setId,
    operation: { status: "idle" },
  };
  const updated = updateTemplateSet(template, { setId, reps: 8, now: 2000 });
  const committed = reduce(state, {
    type: "templateCommitted",
    template: updated,
  });
  expect(committed).toMatchObject({
    originalTemplate: template,
    activeTemplate: updated,
    activeSetId: setId,
  });
  expect(template.exercises[0].sets[0].reps).toBe(5);
  expect(
    reduce(committed, {
      type: "templateCommitted",
      template: removeTemplateSet(updated, { setId, now: 3000 }),
    }),
  ).toMatchObject({ activeSetId: null });
});

it("retains the draft on failure and dismisses only the current error", () => {
  const error = new Error("Update failed");
  const failed = reduce(createState, {
    type: "createOperationFailed",
    operation: { type: "updateSet", templateSetId: setId },
    error,
  });
  expect(failed).toMatchObject({
    activeTemplate: template,
    operation: { status: "error", error },
  });
  expect(
    reduce(failed, {
      type: "operationErrorDismissed",
      error: new Error("stale"),
    }),
  ).toBe(failed);
  expect(
    reduce(failed, { type: "operationErrorDismissed", error }),
  ).toMatchObject({ operation: { status: "idle" } });
});

it("ignores inapplicable events and commits from other templates", () => {
  expect(
    reduce(createState, {
      type: "editOperationStarted",
      operation: { type: "editTemplate" },
    }),
  ).toBe(createState);
  expect(
    reduce(createState, {
      type: "templateCommitted",
      template: createTemplate("other"),
    }),
  ).toBe(createState);
  const cleared = reduce(createState, { type: "templateCleared" });
  expect(cleared).toEqual({ status: "noActiveTemplate" });
  expect(reduce(cleared, { type: "templateCommitted", template })).toBe(
    cleared,
  );
});
