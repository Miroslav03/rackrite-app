import { createElement, type ReactElement } from "react";
import {
  barbellRow,
  competitionBench,
} from "@/domain/templates/editor/tests/templates.test.constants";
import type { TemplateAggregate } from "@/domain/templates/editor/templates.types";
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
) {
  let id = 0;
  const actions = createTemplateSessionActions({
    repository: { insertTemplateAggregate },
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
    if (state.status !== "create") throw new Error("No creation draft");
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
  return { getController, getDraft, insertTemplateAggregate };
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
