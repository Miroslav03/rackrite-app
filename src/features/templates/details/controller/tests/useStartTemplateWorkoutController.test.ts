import { createElement, type ReactElement } from "react";
import { createEmptyWorkout } from "@/domain/workout/workout.useCases";
import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import { WorkoutSessionError } from "@/features/workout/session/workoutSession.errors";
import { failure, success } from "@/shared/types/result";
import { useStartTemplateWorkoutController } from "../useStartTemplateWorkoutController";

type Renderer = {
  update: (element: ReactElement) => void;
  unmount: () => void;
};
const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => Renderer;
}>("react-test-renderer");
type Session = Pick<
  WorkoutSessionController,
  "state" | "startWorkoutFromTemplate"
>;
const renderers: Renderer[] = [];
const workout = createEmptyWorkout({ id: "active", now: 0 });

async function renderController(session: Session) {
  let controller:
    ReturnType<typeof useStartTemplateWorkoutController> | undefined;
  const onStarted = jest.fn();
  function Harness({ focused }: { focused: boolean }) {
    controller = useStartTemplateWorkoutController(session, onStarted, focused);
    return null;
  }
  let renderer: Renderer | undefined;
  await act(async () => {
    renderer = create(createElement(Harness, { focused: true }));
  });
  if (!renderer) throw new Error("Not mounted");
  const mounted = renderer;
  renderers.push(mounted);
  return {
    get() {
      if (!controller) throw new Error("Not mounted");
      return controller;
    },
    onStarted,
    focus: async (focused: boolean) => {
      await act(async () =>
        mounted.update(createElement(Harness, { focused })),
      );
    },
    unmount: async () => {
      await act(async () => mounted.unmount());
    },
  };
}

afterEach(async () => {
  await act(async () => {
    renderers.splice(0).forEach((renderer) => renderer.unmount());
  });
});

it("starts immediately without an active workout", async () => {
  const startWorkoutFromTemplate = jest.fn(async () => success(workout));
  const rendered = await renderController({
    state: { status: "noActiveWorkout", operation: { status: "idle" } },
    startWorkoutFromTemplate,
  });
  await act(async () => rendered.get().requestStart("template"));
  expect(startWorkoutFromTemplate).toHaveBeenCalledWith({
    templateId: "template",
    expectedActiveWorkoutId: null,
  });
  expect(rendered.onStarted).toHaveBeenCalledTimes(1);
});

it("captures the active ID in its switch-based confirmation and supports cancellation", async () => {
  const startWorkoutFromTemplate = jest.fn(async () => success(workout));
  const rendered = await renderController({
    state: { status: "active", workout, operation: { status: "idle" } },
    startWorkoutFromTemplate,
  });
  await act(async () => rendered.get().requestStart("template"));
  expect(rendered.get().overlay).toEqual({
    type: "dangerModal",
    confirmation: {
      action: "startWorkoutFromTemplate",
      templateId: "template",
      expectedActiveWorkoutId: "active",
    },
  });
  expect(startWorkoutFromTemplate).not.toHaveBeenCalled();
  await act(async () => rendered.get().close());
  expect(rendered.get().overlay.type).toBe("none");
  await act(async () => rendered.get().confirm());
  expect(startWorkoutFromTemplate).not.toHaveBeenCalled();
});

it("blocks duplicate confirms and closing while starting, then navigates on success", async () => {
  let resolve: (
    value: Awaited<ReturnType<Session["startWorkoutFromTemplate"]>>,
  ) => void = () => {
    throw new Error("Not initialized");
  };
  const pending = new Promise<
    Awaited<ReturnType<Session["startWorkoutFromTemplate"]>>
  >((accept) => {
    resolve = accept;
  });
  const startWorkoutFromTemplate = jest.fn(() => pending);
  const rendered = await renderController({
    state: { status: "active", workout, operation: { status: "idle" } },
    startWorkoutFromTemplate,
  });
  await act(async () => rendered.get().requestStart("template"));
  await act(async () => {
    rendered.get().confirm();
    rendered.get().confirm();
    rendered.get().close();
  });
  expect(startWorkoutFromTemplate).toHaveBeenCalledTimes(1);
  expect(rendered.get().overlay.type).toBe("dangerModal");
  await act(async () => resolve(success(workout)));
  expect(rendered.get().overlay.type).toBe("none");
  expect(rendered.onStarted).toHaveBeenCalledTimes(1);
});

it.each(["invalidSessionState", "operationFailed"] as const)(
  "handles %s without navigating",
  async (code) => {
    const startWorkoutFromTemplate = jest.fn(async () =>
      failure(new WorkoutSessionError({ code, message: "Failed" })),
    );
    const rendered = await renderController({
      state: { status: "active", workout, operation: { status: "idle" } },
      startWorkoutFromTemplate,
    });
    await act(async () => rendered.get().requestStart("template"));
    await act(async () => rendered.get().confirm());
    expect(rendered.get().overlay.type).toBe(
      code === "invalidSessionState" ? "none" : "dangerModal",
    );
    expect(rendered.onStarted).not.toHaveBeenCalled();
  },
);

it.each(["blur", "unmount"])(
  "does not navigate after %s while starting",
  async (event) => {
    let resolve: (
      value: Awaited<ReturnType<Session["startWorkoutFromTemplate"]>>,
    ) => void = () => {
      throw new Error("Not initialized");
    };
    const pending = new Promise<
      Awaited<ReturnType<Session["startWorkoutFromTemplate"]>>
    >((accept) => {
      resolve = accept;
    });
    const rendered = await renderController({
      state: { status: "noActiveWorkout", operation: { status: "idle" } },
      startWorkoutFromTemplate: () => pending,
    });
    await act(async () => rendered.get().requestStart("template"));
    if (event === "blur") await rendered.focus(false);
    else await rendered.unmount();
    await act(async () => resolve(success(workout)));
    expect(rendered.onStarted).not.toHaveBeenCalled();
  },
);

it("disables starting during hydration and conflicting operations", async () => {
  const startWorkoutFromTemplate = jest.fn(async () => success(workout));
  for (const state of [
    { status: "loading" } as const,
    {
      status: "noActiveWorkout",
      operation: { status: "pending", operation: "startEmptyWorkout" },
    } as const,
  ]) {
    const rendered = await renderController({
      state,
      startWorkoutFromTemplate,
    });
    expect(rendered.get().disabled).toBe(true);
    await act(async () => rendered.get().requestStart("template"));
  }
  expect(startWorkoutFromTemplate).not.toHaveBeenCalled();
});
