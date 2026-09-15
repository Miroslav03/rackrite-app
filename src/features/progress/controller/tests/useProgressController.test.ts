import { createElement, type ReactElement } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { ProgressOverview } from "@/domain/progress/analysis/progress.analysis.types";
import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";

import type { ProgressActions } from "../../actions/progressActions";
import { useProgressController } from "../useProgressController";

import { millisecondsUntilLocalMidnight } from "@/shared/utils/localCalendar";

type Renderer = { unmount(): void; update(element: ReactElement): void };

const { act, create } = jest.requireActual<{
  act(callback: () => void | Promise<void>): Promise<void>;
  create(element: ReactElement): Renderer;
}>("react-test-renderer");

const now = () => Date.now();
const snapshot = () => analyzeCompetitionLifts([], now());
let changeAppState: (status: AppStateStatus) => void;
const renderers: Renderer[] = [];

function deferred() {
  let resolve: (value: ProgressOverview) => void = () => {
    throw new Error("Not initialized");
  };
  const promise = new Promise<ProgressOverview>((accept) => {
    resolve = accept;
  });

  return { resolve, promise };
}

async function mount(actions: ProgressActions, focused = true) {
  let controller: ReturnType<typeof useProgressController> | undefined;
  let renderer: Renderer | undefined;

  function Harness({ focused }: { focused: boolean }) {
    controller = useProgressController(actions, focused, now);

    return null;
  }

  await act(async () => {
    renderer = create(createElement(Harness, { focused }));
  });

  if (!renderer) throw new Error("Not mounted");

  renderers.push(renderer);

  return {
    get() {
      if (!controller) throw new Error("No controller");

      return controller;
    },
    async focus(focused: boolean) {
      await act(async () => {
        renderer?.update(createElement(Harness, { focused }));
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
    .mockImplementation((_event, listener) => {
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

it("loads on focus, preserves selection during a request, and switches without reads", async () => {
  const pending = deferred(),
    actions = { loadOverview: jest.fn(() => pending.promise) };
  const view = await mount(actions, false);

  expect(actions.loadOverview).not.toHaveBeenCalled();
  await view.focus(true);
  await act(async () => {
    view.get().selectLift("squat");
    view.get().selectMetric("volume");
    pending.resolve(snapshot());
  });
  expect(view.get().state).toMatchObject({
    status: "ready",
    selectedLift: "squat",
    metric: "volume",
  });
  await act(async () => {
    view.get().selectLift("deadlift");
    view.get().selectMetric("e1rm");
  });
  expect(actions.loadOverview).toHaveBeenCalledTimes(1);
});

it("coalesces rapid ordinary refreshes", async () => {
  const pending = deferred(),
    actions = { loadOverview: jest.fn(() => pending.promise) };
  const view = await mount(actions);

  await act(async () => {
    void view.get().refresh();
    void view.get().refresh();
  });
  expect(actions.loadOverview).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.resolve(snapshot());
  });
});

it("discards an older request after blur and a newer focus result", async () => {
  const pending = deferred(),
    fresh = snapshot();
  const actions = {
    loadOverview: jest
      .fn<Promise<ProgressOverview>, [number]>()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(fresh),
  };
  const view = await mount(actions);

  await view.focus(false);
  await view.focus(true);
  await act(async () => {
    pending.resolve({ ...fresh, analysisTime: 100 });
  });
  expect(view.get().state).toMatchObject({ status: "ready", overview: fresh });
});

it("invalidates background work and reloads on foreground", async () => {
  const pending = deferred(),
    fresh = snapshot();
  const actions = {
    loadOverview: jest
      .fn<Promise<ProgressOverview>, [number]>()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(fresh),
  };
  const view = await mount(actions);

  await act(async () => {
    changeAppState("background");
    pending.resolve({ ...fresh, analysisTime: 100 });
  });
  expect(view.get().state.status).toBe("loading");
  await act(async () => {
    changeAppState("active");
  });
  expect(view.get().state).toMatchObject({ status: "ready", overview: fresh });
});

it("retains a coherent snapshot with a visible refresh error and retries", async () => {
  const fresh = snapshot();
  const actions = {
    loadOverview: jest
      .fn<Promise<ProgressOverview>, [number]>()
      .mockResolvedValueOnce(fresh)
      .mockRejectedValueOnce(new Error("SQLite unavailable"))
      .mockResolvedValueOnce(fresh),
  };
  const view = await mount(actions);

  await act(async () => {
    await view.get().refresh();
  });
  expect(view.get().state).toMatchObject({
    status: "ready",
    overview: fresh,
    refresh: { status: "error" },
  });
  await act(async () => {
    await view.get().refresh();
  });
  expect(view.get().state).toMatchObject({ refresh: { status: "idle" } });
});

it("handles an initial failure as an error rather than Learning", async () => {
  const view = await mount({
    loadOverview: jest.fn().mockRejectedValue(new Error("broken")),
  });

  expect(view.get().state.status).toBe("loadError");
});

it("refreshes at midnight and cancels timers and requests on unmount", async () => {
  const actions = { loadOverview: jest.fn(async () => snapshot()) };
  const view = await mount(actions);

  await act(async () => {
    jest.advanceTimersByTime(millisecondsUntilLocalMidnight(now()));
  });
  expect(actions.loadOverview).toHaveBeenCalledTimes(2);
  await view.unmount();
  await act(async () => {
    jest.advanceTimersByTime(86_400_000);
  });
  expect(actions.loadOverview).toHaveBeenCalledTimes(2);
});
