import { Modal, RefreshControl } from "react-native";
import {
  act,
  button,
  buttons,
  create,
  dispose,
  press,
  renderCard,
  visibleText,
  type TestRenderer as Renderer,
} from "./progress.cards.test.helpers";

import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import {
  atDay,
  exposure,
  series,
} from "@/domain/progress/tests/progress.test.helpers";

import type { ProgressState } from "../../controller/progress.types";
import { ProgressScreenView } from "../ProgressScreenView";
import { LiftStatusCard } from "../components/LiftStatusCard";
import { NextActionCard } from "../components/NextActionCard";
import { PerformanceTrendCard } from "../components/PerformanceTrendCard";
import { WhyThisStatusCard } from "../components/WhyThisStatusCard";

jest.mock("@/shared/components/feedback/ToastViewport", () => ({
  ToastViewport: () => null,
}));

const ready: Extract<ProgressState, { status: "ready" }> = {
  status: "ready",
  selectedLift: "bench",
  metric: "performance",
  refresh: { status: "idle" },
  overview: analyzeCompetitionLifts(series(Array(16).fill(100)), atDay(60)),
};

it("renders four cards, controlled selectors, and closes the info sheet on Android Back", async () => {
  let renderer: Renderer | undefined;
  const onSelectLift = jest.fn(),
    onSelectMetric = jest.fn();

  await act(async () => {
    renderer = create(
      <ProgressScreenView
        state={ready}
        onRefresh={jest.fn()}
        onSelectLift={onSelectLift}
        onSelectMetric={onSelectMetric}
      />,
    );
  });

  for (const type of [
    LiftStatusCard,
    NextActionCard,
    WhyThisStatusCard,
    PerformanceTrendCard,
  ])
    expect(renderer?.root.findAllByType(type)).toHaveLength(1);

  const squat = renderer?.root.findAllByProps({
    accessibilityLabel: "Squat, LEARNING",
  })[0];

  await act(async () => {
    const press = squat?.props.onPress;

    if (typeof press === "function") press();
  });
  expect(onSelectLift).toHaveBeenCalledWith("squat");

  const volume = renderer?.root.findAllByProps({
    accessibilityLabel: "Volume",
  })[0];

  await act(async () => {
    const press = volume?.props.onPress;

    if (typeof press === "function") press();
  });
  expect(onSelectMetric).toHaveBeenCalledWith("volume");

  if (!renderer) throw new Error("Screen did not render");
  await press(button(renderer.root, "How lift analysis works"));

  const modal = renderer?.root.findAllByType(Modal)[0];

  expect(modal).toBeDefined();
  await act(async () => {
    const close = modal?.props.onRequestClose;

    if (typeof close === "function") close();
  });
  expect(renderer?.root.findAllByType(Modal)).toHaveLength(0);
  await act(async () => {
    renderer?.unmount();
  });
});

it("keeps benchmarks hidden during a retry of an outdated snapshot", async () => {
  let renderer: Renderer | undefined;
  const render = (state: Extract<ProgressState, { status: "ready" }>) => (
    <ProgressScreenView
      state={state}
      onRefresh={jest.fn()}
      onSelectLift={jest.fn()}
      onSelectMetric={jest.fn()}
    />
  );

  await act(async () => {
    renderer = create(
      render({
        ...ready,
        refresh: {
          status: "pending",
          previousError: new Error("failed refresh"),
        },
      }),
    );
  });
  expect(
    renderer?.root.findAllByType(NextActionCard)[0].props.model,
  ).toMatchObject({ benchmark: null });
  await act(async () => {
    renderer?.update(render(ready));
  });

  const model = renderer?.root.findAllByType(NextActionCard)[0].props.model;

  expect(model).toMatchObject({
    benchmark: expect.objectContaining({ value: "100 KG × 5" }),
  });
  await act(async () => {
    renderer?.unmount();
  });
});

function screen(
  state: Extract<ProgressState, { status: "ready" }>,
  onRefresh = jest.fn(),
) {
  return (
    <ProgressScreenView
      state={state}
      onRefresh={onRefresh}
      onSelectLift={jest.fn()}
      onSelectMetric={jest.fn()}
    />
  );
}

it("renders all four cards for empty history without a target or invented values", async () => {
  const renderer = await renderCard(
    screen({ ...ready, overview: analyzeCompetitionLifts([], atDay(60)) }),
  );
  try {
    for (const component of [
      LiftStatusCard,
      NextActionCard,
      WhyThisStatusCard,
      PerformanceTrendCard,
    ])
      expect(renderer.root.findAllByType(component)).toHaveLength(1);
    const text = visibleText(renderer.root);
    expect(text).toEqual(
      expect.arrayContaining([
        "LEARNING",
        "WEAK EVIDENCE",
        "No recent completed competition sessions yet.",
        "KEEP LOGGING COMPARABLE SESSIONS",
        "BUILDING HISTORY",
      ]),
    );
    expect(text).not.toContain("NEXT BENCHMARK");
    expect(text).not.toContain("NEXT PERFORMANCE TARGET");
    const chart = renderer.root.findAllByType(PerformanceTrendCard)[0];
    expect(buttons(chart)).toHaveLength(0);
  } finally {
    await dispose(renderer);
  }
});

it("updates every card to the selected lift and keeps the selected chart metric", async () => {
  const renderer = await renderCard(screen({ ...ready, metric: "e1rm" }));
  try {
    expect(visibleText(renderer.root)).toContain("100 KG × 5");
    await act(async () => {
      renderer.update(
        screen({ ...ready, metric: "e1rm", selectedLift: "squat" }),
      );
    });
    const text = visibleText(renderer.root);
    expect(text).toEqual(
      expect.arrayContaining([
        "SQUAT",
        "LEARNING",
        "KEEP LOGGING COMPARABLE SESSIONS",
        "ESTIMATED 1RM TREND",
        "No eligible performance points in these weeks.",
      ]),
    );
    expect(text).not.toContain("BENCH PRESS");
    expect(text).not.toContain("100 KG × 5");
    expect(text).toContain(
      "The available history is not yet sufficient for a reliable classification.",
    );
    await act(async () => {
      renderer.update(
        screen({ ...ready, metric: "volume", selectedLift: "squat" }),
      );
    });
    expect(visibleText(renderer.root)).toContain("COMPETITION VOLUME");
    expect(visibleText(renderer.root)).not.toContain("ESTIMATED 1RM TREND");
  } finally {
    await dispose(renderer);
  }
});

const populatedOverview = analyzeCompetitionLifts(
  (["squat", "bench", "deadlift"] as const).flatMap((family) =>
    Array.from({ length: 16 }, (_, index) =>
      exposure(index * 4, { family, id: `${family}_${index}` }),
    ),
  ),
  atDay(60),
);

it.each(["lift", "metric", "overview"] as const)(
  "clears selected chart details after a %s change",
  async (change) => {
    const state = { ...ready, overview: populatedOverview };
    const renderer = await renderCard(screen(state));
    try {
      let chart = renderer.root.findAllByType(PerformanceTrendCard)[0];
      expect(buttons(chart)).toHaveLength(8);
      await press(buttons(chart)[0]);
      chart = renderer.root.findAllByType(PerformanceTrendCard)[0];
      expect(buttons(chart)[0].props.accessibilityState).toEqual({
        selected: true,
      });
      expect(visibleText(chart)).toContain(
        buttons(chart)[0].props.accessibilityLabel,
      );
      const next =
        change === "lift"
          ? { ...state, selectedLift: "squat" as const }
          : change === "metric"
            ? { ...state, metric: "volume" as const }
            : {
                ...state,
                overview: { ...populatedOverview, analysisTime: atDay(61) },
              };
      await act(async () => {
        renderer.update(screen(next));
      });
      chart = renderer.root.findAllByType(PerformanceTrendCard)[0];
      expect(buttons(chart)).toHaveLength(8);
      for (const bar of buttons(chart))
        expect(bar.props.accessibilityState).toEqual({ selected: false });
      expect(visibleText(chart)).toContain(
        "Eight calendar weeks. * Current week is incomplete.",
      );
    } finally {
      await dispose(renderer);
    }
  },
);

it("keeps a selected bar through an ordinary refresh with the same overview", async () => {
  const state = { ...ready, overview: populatedOverview };
  const renderer = await renderCard(screen(state));
  try {
    await press(
      buttons(renderer.root.findAllByType(PerformanceTrendCard)[0])[0],
    );
    await act(async () => {
      renderer.update(
        screen({
          ...state,
          refresh: { status: "pending", previousError: null },
        }),
      );
    });
    const chart = renderer.root.findAllByType(PerformanceTrendCard)[0];
    expect(buttons(chart)[0].props.accessibilityState).toEqual({
      selected: true,
    });
    expect(visibleText(renderer.root)).toContain("100 KG × 5");
  } finally {
    await dispose(renderer);
  }
});

it("hides the target on refresh error and retry, then restores it only after success", async () => {
  const onRefresh = jest.fn();
  const error = new Error("History read failed");
  const renderer = await renderCard(screen(ready, onRefresh));
  const warning =
    "Couldn't refresh Progress. These results are outdated; benchmarks are hidden until refresh succeeds.";
  try {
    expect(visibleText(renderer.root)).toContain("100 KG × 5");
    await act(async () => {
      renderer.update(
        screen({ ...ready, refresh: { status: "error", error } }, onRefresh),
      );
    });
    expect(visibleText(renderer.root)).toContain(warning);
    expect(visibleText(renderer.root)).not.toContain("100 KG × 5");
    expect(visibleText(renderer.root)).toContain("BENCH PRESS");
    const retries = buttons(renderer.root).filter((node) =>
      visibleText(node).includes("Try Again"),
    );
    expect(retries).toHaveLength(1);
    await press(retries[0]);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    await act(async () => {
      renderer.update(
        screen(
          { ...ready, refresh: { status: "pending", previousError: error } },
          onRefresh,
        ),
      );
    });
    expect(visibleText(renderer.root)).toContain(warning);
    expect(visibleText(renderer.root)).not.toContain("NEXT BENCHMARK");
    expect(
      renderer.root.findAllByType(RefreshControl)[0].props.refreshing,
    ).toBe(true);
    await act(async () => {
      renderer.update(screen(ready, onRefresh));
    });
    expect(visibleText(renderer.root)).not.toContain(warning);
    expect(visibleText(renderer.root)).toContain("100 KG × 5");
    expect(
      renderer.root.findAllByType(RefreshControl)[0].props.refreshing,
    ).toBe(false);
  } finally {
    await dispose(renderer);
  }
});
