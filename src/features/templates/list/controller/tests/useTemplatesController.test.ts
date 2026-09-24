import { createElement, type ReactElement } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { TemplateListItem } from "@/domain/templates/list/templates.types";
import type { TemplatesActions } from "../../actions/templatesActions";
import { useTemplatesController } from "../useTemplatesController";

type Renderer = {
  unmount: () => void;
  update: (element: ReactElement) => void;
};
const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => Renderer;
}>("react-test-renderer");

const now = () => Date.now();
const renderers: Renderer[] = [];
let changeAppState: (status: AppStateStatus) => void;
const originalAppState = AppState.currentState;

function items(id: string): TemplateListItem[] {
  return [
    {
      id,
      name: id,
      description: null,
      competitionLifts: [],
      lastExecution: null,
    },
  ];
}

function deferred() {
  let resolve: (items: TemplateListItem[]) => void = () => {
    throw new Error("Not initialized");
  };
  let reject: (error: Error) => void = () => {
    throw new Error("Not initialized");
  };
  const promise = new Promise<TemplateListItem[]>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function renderController(actions: TemplatesActions, isFocused = true) {
  let controller: ReturnType<typeof useTemplatesController> | undefined;
  let renderer: Renderer | undefined;
  function Harness({ focused }: { focused: boolean }) {
    controller = useTemplatesController(actions, focused, now);
    return null;
  }
  await act(async () => {
    renderer = create(createElement(Harness, { focused: isFocused }));
  });
  if (!renderer) throw new Error("Controller not mounted");
  const mountedRenderer = renderer;
  renderers.push(mountedRenderer);
  return {
    get() {
      if (!controller) throw new Error("Controller not mounted");
      return controller;
    },
    focus: async (focused: boolean) => {
      await act(async () =>
        mountedRenderer.update(createElement(Harness, { focused })),
      );
    },
    unmount: async () => {
      renderers.splice(renderers.indexOf(mountedRenderer), 1);
      await act(async () => mountedRenderer.unmount());
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: new Date(2026, 8, 24, 12).getTime() });
  AppState.currentState = "active";
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      changeAppState = listener;
      return { remove: jest.fn() };
    });
});

afterEach(async () => {
  await act(async () => {
    for (const renderer of renderers.splice(0)) renderer.unmount();
  });
  AppState.currentState = originalAppState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("loads on focus and replaces the entire list on refresh", async () => {
  const loadTemplates = jest
    .fn()
    .mockResolvedValueOnce(items("old"))
    .mockResolvedValueOnce(items("new"));
  const rendered = await renderController({ loadTemplates }, false);
  expect(loadTemplates).not.toHaveBeenCalled();
  await rendered.focus(true);
  expect(rendered.get().state).toMatchObject({
    status: "ready",
    items: items("old"),
    revision: 1,
  });
  await act(async () => {
    await rendered.get().refresh();
  });
  expect(rendered.get().state).toEqual({
    status: "ready",
    items: items("new"),
    refresh: { status: "idle" },
    revision: 2,
  });
});

it("supports an initial failure, retry, and an empty library", async () => {
  const error = new Error("Database unavailable");
  const loadTemplates = jest
    .fn()
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce([]);
  const rendered = await renderController({ loadTemplates });
  expect(rendered.get().state).toEqual({ status: "loadError", error });
  await act(async () => {
    await rendered.get().refresh();
  });
  expect(rendered.get().state).toEqual({
    status: "ready",
    items: [],
    refresh: { status: "idle" },
    revision: 1,
  });
});

it("retains cards during refresh and on failure until a successful retry", async () => {
  const pending = deferred();
  const original = items("saved");
  const loadTemplates = jest
    .fn()
    .mockResolvedValueOnce(original)
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(items("fresh"));
  const rendered = await renderController({ loadTemplates });
  await act(async () => {
    void rendered.get().refresh();
  });
  expect(rendered.get().state).toMatchObject({
    items: original,
    refresh: { status: "pending" },
  });
  await act(async () => pending.reject(new Error("Read failed")));
  const failed = rendered.get().state;
  expect(failed).toMatchObject({
    items: original,
    refresh: { status: "error" },
    revision: 1,
  });
  if (failed.status !== "ready") throw new Error("Expected saved cards");
  expect(failed.items).toBe(original);
  await act(async () => {
    await rendered.get().refresh();
  });
  expect(rendered.get().state).toMatchObject({
    items: items("fresh"),
    refresh: { status: "idle" },
    revision: 2,
  });
});

it.each(["success", "failure"])(
  "ignores an older refresh's %s after a newer response",
  async (outcome) => {
    const first = deferred();
    const second = deferred();
    const loadTemplates = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const rendered = await renderController({ loadTemplates });
    await act(async () => {
      void rendered.get().refresh();
    });
    await act(async () => second.resolve(items("newest")));
    const current = rendered.get().state;
    await act(async () => {
      if (outcome === "success") first.resolve(items("stale"));
      else first.reject(new Error("Stale failure"));
    });
    expect(rendered.get().state).toBe(current);
  },
);

it("ignores responses after blur and refreshes on refocus", async () => {
  const pending = deferred();
  const loadTemplates = jest
    .fn()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(items("refocused"));
  const rendered = await renderController({ loadTemplates });
  await rendered.focus(false);
  await act(async () => pending.resolve(items("stale")));
  expect(rendered.get().state.status).toBe("loading");
  await rendered.focus(true);
  expect(rendered.get().state).toMatchObject({ items: items("refocused") });
  expect(loadTemplates).toHaveBeenCalledTimes(2);
});

it("suspends requests in the background and refreshes once on foreground return", async () => {
  const pending = deferred();
  const loadTemplates = jest
    .fn()
    .mockResolvedValueOnce(items("saved"))
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(items("foreground"));
  const rendered = await renderController({ loadTemplates });
  await act(async () => {
    void rendered.get().refresh();
    changeAppState("background");
  });
  expect(rendered.get().state).toMatchObject({
    items: items("saved"),
    refresh: { status: "idle" },
  });
  await act(async () => pending.reject(new Error("Interrupted read")));
  await act(async () => {
    changeAppState("active");
    changeAppState("active");
  });
  expect(loadTemplates).toHaveBeenCalledTimes(3);
  expect(rendered.get().state).toMatchObject({ items: items("foreground") });
});

it("waits for the foreground when mounted in the background", async () => {
  AppState.currentState = "background";
  const loadTemplates = jest.fn(async () => []);
  await renderController({ loadTemplates });
  expect(loadTemplates).not.toHaveBeenCalled();
  await act(async () => changeAppState("active"));
  expect(loadTemplates).toHaveBeenCalledTimes(1);
});

it("updates the local date at midnight without another database read", async () => {
  jest.setSystemTime(new Date(2026, 8, 24, 23, 59, 59));
  const loadTemplates = jest.fn(async () => items("saved"));
  const rendered = await renderController({ loadTemplates });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(rendered.get().dateReference).toBe(new Date(2026, 8, 25).getTime());
  expect(loadTemplates).toHaveBeenCalledTimes(1);
  await rendered.focus(false);
  jest.setSystemTime(new Date(2026, 8, 26, 12));
  await rendered.focus(true);
  expect(rendered.get().dateReference).toBe(new Date(2026, 8, 26).getTime());
});

it("removes the listener, cancels the midnight timer, and ignores unmounted requests", async () => {
  const schedule = jest.spyOn(globalThis, "setTimeout");
  const cancel = jest.spyOn(globalThis, "clearTimeout");
  const pending = deferred();
  const rendered = await renderController({
    loadTemplates: () => pending.promise,
  });
  const subscription = jest.mocked(AppState.addEventListener).mock.results[0]
    .value;
  const midnightCall = schedule.mock.calls.findIndex(
    ([, delay]) => delay === 12 * 60 * 60 * 1000,
  );
  expect(midnightCall).toBeGreaterThanOrEqual(0);
  const midnightTimer = schedule.mock.results[midnightCall].value;
  await rendered.unmount();
  expect(subscription.remove).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledWith(midnightTimer);
  await act(async () => pending.resolve(items("late")));
  expect(rendered.get().state.status).toBe("loading");
});
