import { createElement, type ReactElement } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { HistoryPage } from "@/domain/history/history.types";
import { summarizeCompletedWorkout } from "@/domain/history/history.utils";
import { createWorkoutWithAllSetsCompleted } from "@/domain/workout/tests/workout.test.helpers";
import { finishWorkout } from "@/domain/workout/workout.useCases";
import type { HistoryActions } from "@/features/history/actions/historyActions";

import { useHistoryController } from "../useHistoryController";

type Renderer = {
  unmount: () => void;
  update: (element: ReactElement) => void;
};
const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => Renderer;
}>("react-test-renderer");

type Controller = ReturnType<typeof useHistoryController>;
const now = () => Date.now();
const renderers: Renderer[] = [];
let changeAppState: (status: AppStateStatus) => void;

function page(id: string, hasMore = true): HistoryPage {
  const workout = summarizeCompletedWorkout(
    finishWorkout(createWorkoutWithAllSetsCompleted(), {
      now: 10_000,
      skipUnfinishedSets: false,
    }),
  );
  return {
    items: [{ ...workout, id }],
    nextCursor: hasMore ? { finishedAt: 10_000, workoutId: id } : null,
  };
}

function createActions(
  overrides: Partial<HistoryActions> = {},
): HistoryActions {
  return {
    loadOverview: jest.fn(async () => ({
      page: page("first"),
      totalCount: 700,
    })),
    loadNextPage: jest.fn(async () => page("second", false)),
    ...overrides,
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Promise not initialized");
  };
  let reject: (reason: Error) => void = () => {
    throw new Error("Promise not initialized");
  };
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function renderController(actions: HistoryActions, focused = true) {
  let controller: Controller | undefined;
  let renderer: Renderer | undefined;
  function Harness({ isFocused }: { isFocused: boolean }) {
    controller = useHistoryController(actions, isFocused, now);
    return null;
  }
  await act(async () => {
    renderer = create(createElement(Harness, { isFocused: focused }));
  });
  if (!renderer) throw new Error("Renderer was not created");
  renderers.push(renderer);
  return {
    get(): Controller {
      if (!controller) throw new Error("Controller not mounted");
      return controller;
    },
    async focus(isFocused: boolean) {
      await act(async () => {
        renderer?.update(createElement(Harness, { isFocused }));
      });
    },
    async unmount() {
      await act(async () => {
        renderer?.unmount();
      });
    },
  };
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 7, 12).getTime() });
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      changeAppState = listener;
      return { remove: jest.fn() };
    });
});

afterEach(async () => {
  await act(async () => {
    for (const renderer of renderers.splice(0)) renderer.unmount();
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("loads only on focus, appends pages, and stops at the end", async () => {
  const actions = createActions();
  const rendered = await renderController(actions, false);
  expect(actions.loadOverview).not.toHaveBeenCalled();
  await rendered.focus(true);
  expect(rendered.get().state).toMatchObject({
    status: "ready",
    totalCount: 700,
    revision: 1,
  });
  await act(async () => {
    await rendered.get().loadNextPage();
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "first" }, { id: "second" }],
    nextCursor: null,
  });
  await act(async () => {
    await rendered.get().loadNextPage();
  });
  expect(actions.loadNextPage).toHaveBeenCalledTimes(1);
});

it("guards repeated end events before React renders the pending state", async () => {
  const pending = deferred<HistoryPage>();
  const actions = createActions({
    loadNextPage: jest.fn(() => pending.promise),
  });
  const rendered = await renderController(actions);
  await act(async () => {
    void rendered.get().loadNextPage();
    void rendered.get().loadNextPage();
  });
  expect(actions.loadNextPage).toHaveBeenCalledTimes(1);
  expect(rendered.get().state).toMatchObject({
    pagination: { status: "pending" },
  });
  await act(async () => {
    pending.resolve(page("second"));
  });
});

it("keeps cards after pagination failure and retries only explicitly", async () => {
  const loadNextPage = jest
    .fn<
      ReturnType<HistoryActions["loadNextPage"]>,
      Parameters<HistoryActions["loadNextPage"]>
    >()
    .mockRejectedValueOnce(new Error("SQLite unavailable"))
    .mockResolvedValueOnce(page("second"));
  const rendered = await renderController(createActions({ loadNextPage }));
  await act(async () => {
    await rendered.get().loadNextPage();
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "first" }],
    pagination: { status: "error" },
  });
  await act(async () => {
    await rendered.get().loadNextPage();
  });
  expect(loadNextPage).toHaveBeenCalledTimes(1);
  await act(async () => {
    await rendered.get().retryNextPage();
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "first" }, { id: "second" }],
    pagination: { status: "idle" },
  });
});

it("discards an old page that resolves after a refresh", async () => {
  const pending = deferred<HistoryPage>();
  const loadOverview = jest
    .fn<ReturnType<HistoryActions["loadOverview"]>, []>()
    .mockResolvedValueOnce({ page: page("first"), totalCount: 700 })
    .mockResolvedValueOnce({ page: page("new"), totalCount: 701 });
  const rendered = await renderController(
    createActions({ loadOverview, loadNextPage: () => pending.promise }),
  );
  await act(async () => {
    void rendered.get().loadNextPage();
  });
  await act(async () => {
    await rendered.get().refresh();
  });
  await act(async () => {
    pending.resolve(page("stale"));
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "new" }],
    totalCount: 701,
    revision: 2,
  });
});

it("uses only the newest refresh response", async () => {
  const first = deferred<Awaited<ReturnType<HistoryActions["loadOverview"]>>>();
  const second =
    deferred<Awaited<ReturnType<HistoryActions["loadOverview"]>>>();
  const loadOverview = jest
    .fn<ReturnType<HistoryActions["loadOverview"]>, []>()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const rendered = await renderController(createActions({ loadOverview }));
  await act(async () => {
    void rendered.get().refresh();
  });
  await act(async () => {
    second.resolve({ page: page("new"), totalCount: 701 });
  });
  await act(async () => {
    first.resolve({ page: page("old"), totalCount: 700 });
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "new" }],
    totalCount: 701,
  });
});

it("preserves loaded data after refresh failure and replaces pages after a retry", async () => {
  const loadOverview = jest
    .fn<ReturnType<HistoryActions["loadOverview"]>, []>()
    .mockResolvedValueOnce({ page: page("first"), totalCount: 700 })
    .mockRejectedValueOnce(new Error("Refresh failed"))
    .mockResolvedValueOnce({ page: page("fresh"), totalCount: 701 });
  const actions = createActions({ loadOverview });
  const rendered = await renderController(actions);
  await act(async () => {
    await rendered.get().loadNextPage();
  });
  await act(async () => {
    await rendered.get().refresh();
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "first" }, { id: "second" }],
    refresh: { status: "error" },
    revision: 1,
  });
  await act(async () => {
    await rendered.get().refresh();
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "fresh" }],
    refresh: { status: "idle" },
    revision: 2,
  });
});

it("offers retry after initial load failure and supports empty history", async () => {
  const loadOverview = jest
    .fn<ReturnType<HistoryActions["loadOverview"]>, []>()
    .mockRejectedValueOnce(new Error("Offline database failure"))
    .mockResolvedValueOnce({
      page: { items: [], nextCursor: null },
      totalCount: 0,
    });
  const rendered = await renderController(createActions({ loadOverview }));
  expect(rendered.get().state.status).toBe("loadError");
  await act(async () => {
    await rendered.get().refresh();
  });
  expect(rendered.get().state).toMatchObject({
    status: "ready",
    items: [],
    totalCount: 0,
    nextCursor: null,
  });
});

it("ignores responses after blur and reloads on refocus", async () => {
  const pending = deferred<HistoryPage>();
  const actions = createActions({ loadNextPage: () => pending.promise });
  const rendered = await renderController(actions);
  await act(async () => {
    void rendered.get().loadNextPage();
  });
  await rendered.focus(false);
  const previous = rendered.get().state;
  await act(async () => {
    pending.resolve(page("stale"));
  });
  expect(rendered.get().state).toBe(previous);
  await rendered.focus(true);
  expect(actions.loadOverview).toHaveBeenCalledTimes(2);
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "first" }],
    pagination: { status: "idle" },
  });
});

it("suspends background requests and reloads when the app becomes active", async () => {
  const pending = deferred<HistoryPage>();
  const actions = createActions({ loadNextPage: () => pending.promise });
  const rendered = await renderController(actions);
  await act(async () => {
    void rendered.get().loadNextPage();
    changeAppState("background");
  });
  await act(async () => {
    pending.resolve(page("stale"));
  });
  expect(rendered.get().state).toMatchObject({
    items: [{ id: "first" }],
    pagination: { status: "idle" },
  });
  await act(async () => {
    changeAppState("active");
  });
  expect(actions.loadOverview).toHaveBeenCalledTimes(2);
});

it("updates the date at local midnight without refetching workouts", async () => {
  jest.setSystemTime(new Date(2026, 8, 7, 23, 59, 59));
  const actions = createActions();
  const rendered = await renderController(actions);
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(rendered.get().dateReference).toBe(new Date(2026, 8, 8).getTime());
  expect(actions.loadOverview).toHaveBeenCalledTimes(1);
});

it("cleans up timers and ignores requests that finish after unmount", async () => {
  const schedule = jest.spyOn(globalThis, "setTimeout");
  const cancel = jest.spyOn(globalThis, "clearTimeout");
  const pending =
    deferred<Awaited<ReturnType<HistoryActions["loadOverview"]>>>();
  const rendered = await renderController(
    createActions({ loadOverview: () => pending.promise }),
  );
  const midnightCall = schedule.mock.calls.findIndex(
    ([, delay]) => delay === 12 * 60 * 60 * 1000,
  );
  expect(midnightCall).toBeGreaterThanOrEqual(0);
  const midnightTimer = schedule.mock.results[midnightCall].value;
  await rendered.unmount();
  expect(cancel).toHaveBeenCalledWith(midnightTimer);
  await act(async () => {
    pending.resolve({ page: page("late"), totalCount: 1 });
  });
  expect(rendered.get().state.status).toBe("loading");
});

it("deduplicates appended workouts and keeps existing card references stable", async () => {
  const duplicatePage = {
    items: [...page("first").items, ...page("second").items],
    nextCursor: null,
  };
  const rendered = await renderController(
    createActions({ loadNextPage: async () => duplicatePage }),
  );
  const firstState = rendered.get().state;
  await act(async () => {
    await rendered.get().loadNextPage();
  });
  const nextState = rendered.get().state;
  expect(nextState).toMatchObject({
    items: [{ id: "first" }, { id: "second" }],
  });
  if (firstState.status !== "ready" || nextState.status !== "ready")
    throw new Error("Expected loaded history");
  expect(nextState.items[0]).toBe(firstState.items[0]);
});

it("keeps the date stable on same-day refocus", async () => {
  const rendered = await renderController(createActions());
  const previousDate = rendered.get().dateReference;
  await rendered.focus(false);
  jest.setSystemTime(new Date(2026, 8, 7, 18));
  await rendered.focus(true);
  expect(rendered.get().dateReference).toBe(previousDate);
});

it("updates the date when refocusing on the next day", async () => {
  const rendered = await renderController(createActions());
  await rendered.focus(false);
  jest.setSystemTime(new Date(2026, 8, 8, 12));
  await rendered.focus(true);
  expect(rendered.get().dateReference).toBe(new Date(2026, 8, 8).getTime());
});
