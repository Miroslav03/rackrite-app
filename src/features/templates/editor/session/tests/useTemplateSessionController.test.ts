import { createElement, type ReactElement } from "react";

import type { TemplateAggregate } from "@/domain/templates/editor/templates.types";
import {
  barbellRow,
  competitionBench,
} from "@/domain/templates/editor/tests/templates.test.constants";
import {
  createTemplate,
  freezeTemplate,
} from "@/domain/templates/editor/tests/templates.test.helpers";

import { createTemplateSessionActions } from "../../actions/templateSessionActions";
import {
  useTemplateSessionController,
  type TemplateSessionController,
} from "../useTemplateSessionController";

jest.mock("@/data/repositories/templateRepository", () => ({
  templateRepository: { insertTemplateAggregate: jest.fn() },
}));

const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => { unmount: () => void };
}>("react-test-renderer");
const renderers: { unmount: () => void }[] = [];

async function renderSession(
  insertTemplateAggregate = jest.fn<Promise<void>, [TemplateAggregate]>(
    async () => undefined,
  ),
  {
    getTemplateAggregateById = jest.fn<
      Promise<TemplateAggregate | null>,
      [string]
    >(async () => null),
    updateTemplateAggregate = jest.fn<
      Promise<void>,
      [TemplateAggregate, TemplateAggregate]
    >(async () => undefined),
  } = {},
) {
  let id = 0;
  const actions = createTemplateSessionActions({
    repository: {
      insertTemplateAggregate,
      getTemplateAggregateById,
      updateTemplateAggregate,
    },
    now: () => 2000,
    createTemplateId: () => `template-${++id}`,
    createTemplateExerciseId: () => `exercise-${++id}`,
    createTemplateSetId: () => `set-${++id}`,
  });
  let controller: TemplateSessionController | undefined;
  function Harness() {
    controller = useTemplateSessionController(actions);
    return null;
  }
  function getController() {
    if (!controller) throw new Error("Controller not mounted");
    return controller;
  }
  function getDraft() {
    const state = getController().state;
    if (state.status !== "create" && state.status !== "edit")
      throw new Error("No template draft");
    return state.activeTemplate;
  }
  await act(async () => {
    renderers.push(create(createElement(Harness)));
  });
  await act(async () => {
    const session = getController();
    session.createEmptyTemplate();
    session.addExercise({ exercise: competitionBench });
    session.addExercise({ exercise: barbellRow });
  });
  return {
    getController,
    getDraft,
    insertTemplateAggregate,
    getTemplateAggregateById,
    updateTemplateAggregate,
  };
}

afterEach(async () => {
  await act(async () => {
    for (const renderer of renderers.splice(0)) renderer.unmount();
  });
});

it("applies same-render draft commands without persistence and clears a removed selection", async () => {
  const r = await renderSession();
  const [first, second] = r.getDraft().exercises;
  await act(async () => {
    const session = r.getController();
    session.selectSet(first.sets[0].id);
    session.addSet({ templateExerciseId: first.templateExercise.id });
    session.updateExerciseOrder({
      templateExerciseId: second.templateExercise.id,
      orderIndex: 0,
    });
  });
  expect(r.getDraft().exercises[1].sets).toHaveLength(2);
  expect(r.getController().state).toMatchObject({
    activeSetId: first.sets[0].id,
  });
  await act(async () => {
    r.getController().removeExercise({
      templateExerciseId: first.templateExercise.id,
    });
  });
  expect(r.getDraft().exercises).toHaveLength(1);
  expect(r.getDraft().exercises[0].templateExercise).toMatchObject({
    id: second.templateExercise.id,
    orderIndex: 0,
  });
  expect(r.getController().state).toMatchObject({ activeSetId: null });
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
});

it("blocks duplicate saves and all draft changes until the insert succeeds", async () => {
  let resolveInsert: () => void = () => undefined;
  const insert = jest.fn<Promise<void>, [TemplateAggregate]>(
    () =>
      new Promise((resolve) => {
        resolveInsert = resolve;
      }),
  );
  const r = await renderSession(insert);
  const draft = r.getDraft();
  const exerciseId = draft.exercises[0].templateExercise.id;
  const setId = draft.exercises[0].sets[0].id;
  let pending:
    ReturnType<TemplateSessionController["createTemplate"]> | undefined;
  await act(async () => {
    const session = r.getController();
    pending = session.createTemplate();
    expect((await session.createTemplate()).success).toBe(false);
    expect((await session.editTemplate("another-template")).success).toBe(
      false,
    );
    expect(session.addExercise({ exercise: barbellRow }).success).toBe(false);
    expect(session.addSet({ templateExerciseId: exerciseId }).success).toBe(
      false,
    );
    expect(
      session.removeExercise({ templateExerciseId: exerciseId }).success,
    ).toBe(false);
    expect(
      session.updateExerciseOrder({
        templateExerciseId: exerciseId,
        orderIndex: 1,
      }).success,
    ).toBe(false);
    expect(
      session.updateSet({ templateSetId: setId, values: { reps: 10 } }).success,
    ).toBe(false);
    expect(session.removeSet({ templateSetId: setId }).success).toBe(false);
    expect(session.selectSet(setId).success).toBe(false);
    session.discardTemplate();
    session.createEmptyTemplate();
  });
  expect(insert).toHaveBeenCalledTimes(1);
  expect(r.getTemplateAggregateById).not.toHaveBeenCalled();
  expect(insert).toHaveBeenCalledWith(draft);
  expect(r.getController().state).toMatchObject({
    activeTemplate: draft,
    operation: { status: "pending", operation: { type: "createTemplate" } },
  });
  await act(async () => {
    resolveInsert();
    expect((await pending)?.success).toBe(true);
  });
  expect(r.getController().state).toEqual({ status: "noActiveTemplate" });
  await act(async () => {
    expect((await r.getController().createTemplate()).success).toBe(false);
  });
  expect(insert).toHaveBeenCalledTimes(1);
});

it("keeps the draft on failure, allows edits, and saves the latest draft on retry", async () => {
  const error = new Error("Disk full");
  const insert = jest
    .fn<Promise<void>, [TemplateAggregate]>()
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce(undefined);
  const r = await renderSession(insert);
  const draft = r.getDraft();
  await act(async () => {
    expect((await r.getController().createTemplate()).success).toBe(false);
  });
  expect(r.getDraft()).toBe(draft);
  expect(r.getController().state).toMatchObject({
    operation: {
      status: "error",
      operation: { type: "createTemplate" },
      error,
    },
  });
  await act(async () => {
    const session = r.getController();
    session.updateSet({
      templateSetId: draft.exercises[0].sets[0].id,
      values: { reps: 12 },
    });
    expect((await session.createTemplate()).success).toBe(true);
  });
  expect(insert.mock.calls[1][0].exercises[0].sets[0].reps).toBe(12);
  expect(r.getController().state).toEqual({ status: "noActiveTemplate" });
});

it("rejects an empty creation draft without writing or clearing it", async () => {
  const r = await renderSession();
  await act(async () => {
    r.getController().createEmptyTemplate();
    expect((await r.getController().createTemplate()).success).toBe(false);
  });
  expect(r.getDraft().template.name).toBe("New Template");
  expect(r.getDraft().exercises).toEqual([]);
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
});

it("updates description in the draft and includes it in creation", async () => {
  const r = await renderSession();
  await act(async () => {
    const result = r
      .getController()
      .updateMetadata({ description: "  Pause every rep  " });
    expect(result.success).toBe(true);
  });
  expect(r.getDraft().template.description).toBe("Pause every rep");
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
  await act(async () => {
    await r.getController().createTemplate();
  });
  expect(r.insertTemplateAggregate).toHaveBeenCalledWith(
    expect.objectContaining({
      template: expect.objectContaining({ description: "Pause every rep" }),
    }),
  );
});

it("loads a saved template, keeps the original immutable, and saves the latest same-render draft", async () => {
  const original = freezeTemplate(createTemplate());
  const r = await renderSession(undefined, {
    getTemplateAggregateById: jest.fn<
      Promise<TemplateAggregate | null>,
      [string]
    >(async () => original),
  });
  await act(async () => {
    expect(
      (await r.getController().editTemplate(original.template.id)).success,
    ).toBe(true);
  });
  expect(r.getTemplateAggregateById).toHaveBeenCalledWith(original.template.id);
  expect(r.getController().state).toEqual({
    status: "edit",
    originalTemplate: original,
    activeTemplate: original,
    activeSetId: null,
    operation: { status: "idle" },
  });
  const [first, second] = original.exercises;
  await act(async () => {
    const session = r.getController();
    session.updateMetadata({ description: "Pause every rep" });
    session.updateSet({ templateSetId: first.sets[0].id, values: { reps: 8 } });
    session.addSet({ templateExerciseId: first.templateExercise.id });
    session.updateExerciseOrder({
      templateExerciseId: second.templateExercise.id,
      orderIndex: 0,
    });
  });
  expect(r.updateTemplateAggregate).not.toHaveBeenCalled();
  expect(r.getController().state).toMatchObject({ originalTemplate: original });
  expect(original.exercises[0].sets[0].reps).toBe(5);
  expect(original.template.description).toBeNull();
  await act(async () => {
    const session = r.getController();
    session.removeExercise({ templateExerciseId: second.templateExercise.id });
    expect((await session.updateTemplate()).success).toBe(true);
  });
  expect(r.updateTemplateAggregate).toHaveBeenCalledTimes(1);
  const [previous, next] = r.updateTemplateAggregate.mock.calls[0];
  expect(previous).toBe(original);
  expect(next.template).toMatchObject({
    id: original.template.id,
    description: "Pause every rep",
    createdAt: 1000,
  });
  expect(next.exercises).toHaveLength(1);
  expect(next.exercises[0].sets).toHaveLength(3);
  expect(next.exercises[0].sets[0].reps).toBe(8);
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
  expect(r.getController().state).toEqual({ status: "noActiveTemplate" });
});

it("blocks competing commands while loading and releases the guard after a load failure", async () => {
  const error = new Error("Read failed");
  let rejectLoad: (error: Error) => void = () => undefined;
  const load = jest.fn<Promise<TemplateAggregate | null>, [string]>(
    () =>
      new Promise((_, reject) => {
        rejectLoad = reject;
      }),
  );
  const r = await renderSession(undefined, { getTemplateAggregateById: load });
  let pending:
    ReturnType<TemplateSessionController["editTemplate"]> | undefined;
  await act(async () => {
    const session = r.getController();
    pending = session.editTemplate("saved");
    expect((await session.editTemplate("other")).success).toBe(false);
    expect((await session.updateTemplate()).success).toBe(false);
    expect((await session.createTemplate()).success).toBe(false);
    expect(session.updateMetadata({ description: "blocked" }).success).toBe(
      false,
    );
    expect(session.selectSet(null).success).toBe(false);
    session.createEmptyTemplate();
    session.discardTemplate();
  });
  expect(load).toHaveBeenCalledTimes(1);
  expect(r.getController().state).toEqual({ status: "loading" });
  await act(async () => {
    rejectLoad(error);
    expect(await pending).toEqual({ success: false, error });
  });
  expect(r.getController().state).toEqual({ status: "loadError", error });
  const original = freezeTemplate(createTemplate("saved"));
  load.mockResolvedValueOnce(original);
  await act(async () => {
    expect((await r.getController().editTemplate("saved")).success).toBe(true);
  });
  expect(r.getDraft()).toBe(original);
});

it("reports a missing template without creating a replacement", async () => {
  const r = await renderSession();
  await act(async () => {
    expect((await r.getController().editTemplate("missing")).success).toBe(
      false,
    );
  });
  expect(r.getController().state).toEqual({
    status: "loadError",
    error: new Error("Template not found"),
  });
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
  expect(r.updateTemplateAggregate).not.toHaveBeenCalled();
});

it("blocks duplicate updates and draft changes, then preserves both aggregates on failure for retry", async () => {
  const original = freezeTemplate(createTemplate());
  const error = new Error("Disk full");
  let rejectUpdate: (error: Error) => void = () => undefined;
  const update = jest.fn<Promise<void>, [TemplateAggregate, TemplateAggregate]>(
    () =>
      new Promise((_, reject) => {
        rejectUpdate = reject;
      }),
  );
  const r = await renderSession(undefined, {
    getTemplateAggregateById: jest.fn<
      Promise<TemplateAggregate | null>,
      [string]
    >(async () => original),
    updateTemplateAggregate: update,
  });
  await act(async () => {
    await r.getController().editTemplate(original.template.id);
    r.getController().updateMetadata({ description: "Draft" });
  });
  const draft = r.getDraft();
  const exerciseId = draft.exercises[0].templateExercise.id;
  const setId = draft.exercises[0].sets[0].id;
  let pending:
    ReturnType<TemplateSessionController["updateTemplate"]> | undefined;
  await act(async () => {
    const session = r.getController();
    pending = session.updateTemplate();
    expect((await session.updateTemplate()).success).toBe(false);
    expect((await session.createTemplate()).success).toBe(false);
    expect((await session.editTemplate("other")).success).toBe(false);
    expect(session.updateMetadata({ description: "blocked" }).success).toBe(
      false,
    );
    expect(session.addExercise({ exercise: barbellRow }).success).toBe(false);
    expect(
      session.removeExercise({ templateExerciseId: exerciseId }).success,
    ).toBe(false);
    expect(
      session.updateExerciseOrder({
        templateExerciseId: exerciseId,
        orderIndex: 1,
      }).success,
    ).toBe(false);
    expect(session.addSet({ templateExerciseId: exerciseId }).success).toBe(
      false,
    );
    expect(
      session.updateSet({ templateSetId: setId, values: { reps: 10 } }).success,
    ).toBe(false);
    expect(session.removeSet({ templateSetId: setId }).success).toBe(false);
    expect(session.selectSet(setId).success).toBe(false);
    session.createEmptyTemplate();
    session.discardTemplate();
  });
  expect(update).toHaveBeenCalledTimes(1);
  expect(r.getTemplateAggregateById).toHaveBeenCalledTimes(1);
  expect(r.getController().state).toMatchObject({
    status: "edit",
    originalTemplate: original,
    activeTemplate: draft,
    operation: { status: "pending", operation: { type: "editTemplate" } },
  });
  await act(async () => {
    rejectUpdate(error);
    expect(await pending).toEqual({ success: false, error });
  });
  expect(r.getController().state).toMatchObject({
    originalTemplate: original,
    activeTemplate: draft,
    operation: { status: "error", operation: { type: "editTemplate" }, error },
  });
  update.mockResolvedValueOnce(undefined);
  await act(async () => {
    const session = r.getController();
    session.updateSet({ templateSetId: setId, values: { reps: 12 } });
    expect((await session.updateTemplate()).success).toBe(true);
  });
  expect(update.mock.calls[1][0]).toBe(original);
  expect(update.mock.calls[1][1].exercises[0].sets[0].reps).toBe(12);
  expect(r.getController().state).toEqual({ status: "noActiveTemplate" });
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
});

it("discards edit changes without persistence and reloads the stored version when reopened", async () => {
  const original = freezeTemplate(createTemplate());
  const r = await renderSession(undefined, {
    getTemplateAggregateById: jest.fn<
      Promise<TemplateAggregate | null>,
      [string]
    >(async () => original),
  });
  await act(async () => {
    const session = r.getController();
    await session.editTemplate(original.template.id);
    session.updateMetadata({ description: "Discard me" });
    session.removeSet({ templateSetId: original.exercises[0].sets[0].id });
    session.discardTemplate();
    expect((await session.updateTemplate()).success).toBe(false);
  });
  expect(r.getController().state).toEqual({ status: "noActiveTemplate" });
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
  expect(r.updateTemplateAggregate).not.toHaveBeenCalled();
  await act(async () => {
    await r.getController().editTemplate(original.template.id);
  });
  expect(r.getDraft()).toBe(original);
});

it("allows unchanged edits but rejects empty edit drafts before persistence", async () => {
  const original = freezeTemplate(createTemplate());
  const r = await renderSession(undefined, {
    getTemplateAggregateById: jest.fn<
      Promise<TemplateAggregate | null>,
      [string]
    >(async () => original),
  });
  await act(async () => {
    const session = r.getController();
    expect((await session.updateTemplate()).success).toBe(false);
    await session.editTemplate(original.template.id);
    expect((await session.createTemplate()).success).toBe(false);
    expect((await session.updateTemplate()).success).toBe(true);
  });
  expect(r.updateTemplateAggregate).toHaveBeenCalledWith(original, original);
  await act(async () => {
    const session = r.getController();
    await session.editTemplate(original.template.id);
    for (const exercise of original.exercises) {
      session.removeExercise({
        templateExerciseId: exercise.templateExercise.id,
      });
    }
    expect((await session.updateTemplate()).success).toBe(false);
  });
  expect(r.getDraft().exercises).toEqual([]);
  expect(r.updateTemplateAggregate).toHaveBeenCalledTimes(1);
  expect(r.insertTemplateAggregate).not.toHaveBeenCalled();
});
