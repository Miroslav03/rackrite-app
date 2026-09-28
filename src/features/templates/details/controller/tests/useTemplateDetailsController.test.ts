import { createElement, type ReactElement } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { TemplateDetails } from "@/domain/templates/details/templates.types";
import { selectTemplateDetails } from "@/domain/templates/details/templates.selectors";
import { createTemplate } from "@/domain/templates/editor/tests/templates.test.helpers";
import type { TemplateDetailsActions } from "../../actions/templateDetailsActions";
import { useTemplateDetailsController } from "../useTemplateDetailsController";

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

function details(id = "template_1"): TemplateDetails {
  return selectTemplateDetails(createTemplate(id), null);
}

function deferred() {
  let resolve: (items: TemplateDetails | null) => void = () => {
    throw new Error("Not initialized");
  };
  let reject: (error: Error) => void = () => {
    throw new Error("Not initialized");
  };
  const promise = new Promise<TemplateDetails | null>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function renderController(
  actions: TemplateDetailsActions,
  isFocused = true,
  initialTemplateId = "template_1",
) {
  let controller: ReturnType<typeof useTemplateDetailsController> | undefined;
  let renderer: Renderer | undefined;
  function Harness({
    focused,
    templateId = initialTemplateId,
  }: {
    focused: boolean;
    templateId?: string;
  }) {
    controller = useTemplateDetailsController(
      actions,
      templateId,
      focused,
      now,
    );
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
    setTemplateId: async (templateId: string) => {
      await act(async () =>
        mountedRenderer.update(
          createElement(Harness, { focused: true, templateId }),
        ),
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

it("loads on focus, reports an error, retries and handles a deleted template", async () => {
  const error = new Error("Read failed");
  const loadDetails = jest
    .fn()
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce(details())
    .mockResolvedValueOnce(null);
  const rendered = await renderController({ loadDetails }, false);
  expect(loadDetails).not.toHaveBeenCalled();
  await rendered.focus(true);
  expect(rendered.get().state).toEqual({ status: "loadError", error });
  await act(async () => {
    await rendered.get().retry();
  });
  expect(rendered.get().state).toEqual({
    status: "ready",
    template: details(),
  });
  await act(async () => {
    await rendered.get().retry();
  });
  expect(rendered.get().state).toEqual({ status: "unavailable" });
});

it.each(["success", "failure"])(
  "ignores stale %s after a newer request",
  async (outcome) => {
    const first = deferred();
    const second = deferred();
    const rendered = await renderController({
      loadDetails: jest
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    });
    await act(async () => {
      void rendered.get().retry();
    });
    await act(async () => second.resolve(details("new")));
    await act(async () => {
      if (outcome === "success") first.resolve(details("old"));
      else first.reject(new Error("Stale"));
    });
    expect(rendered.get().state).toEqual({
      status: "ready",
      template: details("new"),
    });
  },
);

it("ignores blurred responses and reloads on focus", async () => {
  const pending = deferred();
  const loadDetails = jest
    .fn()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(details());
  const rendered = await renderController({ loadDetails });
  await rendered.focus(false);
  await act(async () => pending.resolve(details("stale")));
  expect(rendered.get().state).toEqual({ status: "loading" });
  await rendered.focus(true);
  expect(rendered.get().state).toEqual({
    status: "ready",
    template: details(),
  });
});

it("suspends in the background and refreshes once on foreground return", async () => {
  const pending = deferred();
  const loadDetails = jest
    .fn()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(details());
  const rendered = await renderController({ loadDetails });
  await act(async () => changeAppState("background"));
  await act(async () => pending.reject(new Error("Interrupted")));
  expect(rendered.get().state).toEqual({ status: "loading" });
  await act(async () => {
    changeAppState("active");
    changeAppState("active");
  });
  expect(loadDetails).toHaveBeenCalledTimes(2);
  expect(rendered.get().state).toEqual({
    status: "ready",
    template: details(),
  });
});

it("waits for foreground when mounted in the background", async () => {
  AppState.currentState = "background";
  const loadDetails = jest.fn(async () => details());
  await renderController({ loadDetails });
  expect(loadDetails).not.toHaveBeenCalled();
  await act(async () => changeAppState("active"));
  expect(loadDetails).toHaveBeenCalledTimes(1);
});

it("updates the date at local midnight without reading the database", async () => {
  jest.setSystemTime(new Date(2026, 8, 24, 23, 59, 59));
  const loadDetails = jest.fn(async () => details());
  const rendered = await renderController({ loadDetails });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(rendered.get().dateReference).toBe(new Date(2026, 8, 25).getTime());
  expect(loadDetails).toHaveBeenCalledTimes(1);
});

it("cleans up timers and listeners and ignores unmounted requests", async () => {
  const pending = deferred();
  const rendered = await renderController({
    loadDetails: () => pending.promise,
  });
  const subscription = jest.mocked(AppState.addEventListener).mock.results[0]
    .value;
  const cancel = jest.spyOn(globalThis, "clearTimeout");
  await rendered.unmount();
  expect(subscription.remove).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalled();
  await act(async () => pending.resolve(details()));
  expect(rendered.get().state).toEqual({ status: "loading" });
});

it("handles a missing route ID without a database read", async () => {
  const loadDetails = jest.fn(async () => details());
  const rendered = await renderController({ loadDetails }, true, "");
  expect(rendered.get().state).toEqual({ status: "unavailable" });
  expect(loadDetails).not.toHaveBeenCalled();
});

it("ignores an old template's response after the route ID changes", async () => {
  const pending = deferred();
  const loadDetails = jest
    .fn()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(details("second"));
  const rendered = await renderController({ loadDetails });
  await rendered.setTemplateId("second");
  expect(loadDetails).toHaveBeenLastCalledWith("second");
  await act(async () => pending.resolve(details("template_1")));
  expect(rendered.get().state).toEqual({
    status: "ready",
    template: details("second"),
  });
});
