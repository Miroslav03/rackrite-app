import { createElement, type ReactElement } from "react";
import {
  barbellRow,
  competitionBench,
} from "@/domain/templates/editor/tests/templates.test.constants";
import type { TemplateAggregate } from "@/domain/templates/editor/templates.types";
import { createTemplateSessionActions } from "../../../actions/templateSessionActions";
import {
  useTemplateSessionController,
  type TemplateSessionController,
} from "../../../session/useTemplateSessionController";
import { useTemplateEditorDockEditor } from "../useTemplateEditorDockEditor";

const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => { unmount: () => void };
}>("react-test-renderer");
const renderers: { unmount: () => void }[] = [];

async function renderEditor() {
  let nextId = 0;
  const actions = createTemplateSessionActions({
    now: () => Date.now(),
    createTemplateId: () => `template-${++nextId}`,
    createTemplateExerciseId: () => `exercise-${++nextId}`,
    createTemplateSetId: () => `set-${++nextId}`,
  });
  const updateSet = jest.spyOn(actions, "updateSet");
  let session: TemplateSessionController | undefined;
  let editor: ReturnType<typeof useTemplateEditorDockEditor> | undefined;
  function DockHarness({
    template,
    activeSetId,
    controller,
  }: {
    template: TemplateAggregate;
    activeSetId: string | null;
    controller: TemplateSessionController;
  }) {
    editor = useTemplateEditorDockEditor(template, activeSetId, controller);
    return null;
  }
  function Harness() {
    session = useTemplateSessionController(actions);
    if (session.state.status !== "create" && session.state.status !== "edit")
      return null;
    return createElement(DockHarness, {
      template: session.state.activeTemplate,
      activeSetId: session.state.activeSetId,
      controller: session,
    });
  }
  function getSession() {
    if (!session) throw new Error("Session not mounted");
    return session;
  }
  function getEditor() {
    if (!editor) throw new Error("Editor not mounted");
    return editor;
  }
  function getState() {
    const state = getSession().state;
    if (state.status !== "create" && state.status !== "edit")
      throw new Error("No draft");
    return state;
  }
  await act(async () => {
    renderers.push(create(createElement(Harness)));
  });
  await act(async () => {
    const controller = getSession();
    controller.createEmptyTemplate();
    controller.addExercise({ exercise: competitionBench });
    controller.addExercise({ exercise: barbellRow });
  });
  const firstId = getState().activeTemplate.exercises[0].sets[0].id;
  const secondId = getState().activeTemplate.exercises[1].sets[0].id;
  return { getSession, getEditor, getState, firstId, secondId, updateSet };
}

beforeEach(() => jest.useFakeTimers({ now: 2000 }));
afterEach(async () => {
  await act(async () => {
    for (const renderer of renderers.splice(0)) renderer.unmount();
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("adds exercises in the same render without lost updates or automatic selection", async () => {
  const rendered = await renderEditor();
  expect(rendered.getState().activeTemplate.exercises).toHaveLength(2);
  expect(rendered.getState().activeSetId).toBeNull();
  expect(rendered.getEditor().panel).toBeNull();
});

it("shows keypresses immediately and commits reps after one second", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    const editor = r.getEditor();
    editor.pressRepsKey("clear");
    editor.pressRepsKey("1");
    editor.pressRepsKey("2");
  });
  expect(r.getEditor().repsDraft).toBe("12");
  expect(r.getEditor().activeSet?.reps).toBe(5);
  await act(async () => {
    jest.advanceTimersByTime(999);
  });
  expect(r.updateSet).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(r.getEditor().activeSet?.reps).toBe(12);
  expect(r.updateSet).toHaveBeenCalledTimes(1);
});

it("flushes before switching sets and keeps updates on the original set", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("clear");
    r.getEditor().pressRepsKey("8");
    await r.getEditor().openSetEditor(r.secondId, "rpe");
  });
  expect(r.getState().activeTemplate.exercises[0].sets[0].reps).toBe(8);
  expect(r.getEditor().activeSet?.id).toBe(r.secondId);
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(r.getState().activeTemplate.exercises[1].sets[0].reps).toBe(5);
});

it("flushes before switching panels and updates RPE/type immediately", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("clear");
    r.getEditor().pressRepsKey("3");
    await r.getEditor().openSetEditor(r.firstId, "rpe");
    r.getEditor().selectRpe(8);
    await r.getEditor().openSetEditor(r.firstId, "setType");
    r.getEditor().selectSetType("top");
  });
  expect(r.getEditor().activeSet).toMatchObject({
    reps: 3,
    rpe: 8,
    type: "top",
  });
});

it.each(["setType", "rpe", "repsKeypad"] as const)(
  "closes %s and clears selection",
  async (panel) => {
    const r = await renderEditor();
    await act(async () => {
      await r.getEditor().openSetEditor(r.firstId, panel);
    });
    await act(async () => {
      expect(await r.getEditor().closeSetEditor()).toBe(true);
    });
    expect(r.getState().activeSetId).toBeNull();
    expect(r.getEditor().panel).toBeNull();
  },
);

it("flushes reps on close before the timeout", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("clear");
    r.getEditor().pressRepsKey("9");
    await r.getEditor().closeSetEditor();
    jest.advanceTimersByTime(1000);
  });
  expect(r.getState().activeTemplate.exercises[0].sets[0].reps).toBe(9);
  expect(r.updateSet).toHaveBeenCalledTimes(1);
});

it("restores committed reps after clearing, cancelling an earlier pending value", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("clear");
    r.getEditor().pressRepsKey("9");
    r.getEditor().pressRepsKey("clear");
  });
  expect(r.getEditor().repsDraft).toBe("");
  await act(async () => {
    jest.advanceTimersByTime(1000);
    await r.getEditor().closeSetEditor();
  });
  expect(r.updateSet).not.toHaveBeenCalled();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  expect(r.getEditor().repsDraft).toBe("5");
});

it("keeps a failed update open and retries on the next close", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  r.updateSet.mockImplementationOnce(() => {
    throw new Error("Cannot update");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("clear");
    r.getEditor().pressRepsKey("7");
    expect(await r.getEditor().closeSetEditor()).toBe(false);
  });
  expect(r.getState().activeSetId).toBe(r.firstId);
  expect(r.getState().operation).toMatchObject({ status: "error" });
  await act(async () => {
    expect(await r.getEditor().closeSetEditor()).toBe(true);
  });
  expect(r.getState().activeTemplate.exercises[0].sets[0].reps).toBe(7);
});

it("lets the latest close win over a pending open without reopening", async () => {
  const r = await renderEditor();
  await act(async () => {
    const editor = r.getEditor();
    await Promise.all([
      editor.openSetEditor(r.firstId, "rpe"),
      editor.closeSetEditor(),
      editor.closeSetEditor(),
    ]);
  });
  expect(r.getState().activeSetId).toBeNull();
  expect(r.getEditor().panel).toBeNull();
});

it("lets the latest set switch win", async () => {
  const r = await renderEditor();
  await act(async () => {
    const editor = r.getEditor();
    await Promise.all([
      editor.openSetEditor(r.firstId, "rpe"),
      editor.openSetEditor(r.secondId, "setType"),
    ]);
  });
  expect(r.getState().activeSetId).toBe(r.secondId);
  expect(r.getEditor().panel).toEqual({ type: "setType" });
});

it("rejects stale edits after deletion and does not select another set automatically", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("8");
    r.getSession().removeSet({ templateSetId: r.firstId });
    jest.advanceTimersByTime(1000);
  });
  expect(r.getState().activeTemplate.exercises).toHaveLength(1);
  expect(r.getState().activeSetId).toBeNull();
  expect(r.getEditor().panel).toBeNull();
  expect(r.getState().activeTemplate.exercises[0].sets[0].reps).toBe(5);
});

it("cancels delayed work on discard and rejects stale commands after clearing", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("8");
    r.getEditor().cancelPendingUpdates();
    r.getSession().discardTemplate();
    expect(
      r
        .getSession()
        .updateSet({ templateSetId: r.firstId, values: { reps: 10 } }).success,
    ).toBe(false);
    jest.advanceTimersByTime(1000);
  });
  expect(r.getSession().state.status).toBe("noActiveTemplate");
  expect(r.updateSet).not.toHaveBeenCalled();
});

it("cancels the debounce and pending transitions on unmount", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("8");
    for (const renderer of renderers.splice(0)) renderer.unmount();
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(r.updateSet).not.toHaveBeenCalled();
});

it("restores an empty draft before opening a confirmation", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("clear");
    expect(await r.getEditor().savePendingKeypadUpdate()).toBe(true);
  });
  expect(r.getEditor().repsDraft).toBe("5");
  expect(r.getState().activeSetId).toBe(r.firstId);
});

it("can open another set after the selected set is removed externally", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    r.getEditor().pressRepsKey("8");
    r.getSession().removeSet({ templateSetId: r.firstId });
  });
  await act(async () => {
    await r.getEditor().openSetEditor(r.secondId, "rpe");
  });
  expect(r.getState().activeSetId).toBe(r.secondId);
  expect(r.updateSet).not.toHaveBeenCalled();
});

it("preserves new input arriving during a flush before the latest close", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    const editor = r.getEditor();
    editor.pressRepsKey("clear");
    editor.pressRepsKey("1");
    const firstClose = editor.closeSetEditor();
    editor.pressRepsKey("2");
    const secondClose = editor.closeSetEditor();
    await Promise.all([firstClose, secondClose]);
  });
  expect(r.getState().activeTemplate.exercises[0].sets[0].reps).toBe(12);
  expect(r.getState().activeSetId).toBeNull();
  const callCount = r.updateSet.mock.calls.length;
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(r.updateSet).toHaveBeenCalledTimes(callCount);
});

it("uses flushed reps when reopening the same set before another render", async () => {
  const r = await renderEditor();
  await act(async () => {
    await r.getEditor().openSetEditor(r.firstId, "repsKeypad");
  });
  await act(async () => {
    const editor = r.getEditor();
    editor.pressRepsKey("clear");
    editor.pressRepsKey("9");
    await editor.openSetEditor(r.firstId, "rpe");
    await editor.openSetEditor(r.firstId, "repsKeypad");
  });
  expect(r.getEditor().repsDraft).toBe("9");
});
