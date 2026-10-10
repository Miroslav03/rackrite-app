import { createElement, type ComponentProps } from "react";
import { Modal, RefreshControl } from "react-native";
import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import { atDay, exposure } from "@/domain/progress/tests/progress.test.helpers";
import { ProgressScreenView } from "../ProgressScreenView";
import { createProgressViewModel } from "../progress.viewModel";
import { colors } from "@/shared/theme/tokens";
import { WhyThisStatusCard } from "../components/WhyThisStatusCard";
import { ProgressStoryHost } from "../stories/ProgressStoryHost";
import { progressStoryScenarios } from "../stories/progressStory.scenarios";
import {
  baseOverview,
  cardModel,
  renderCard,
  dispose,
  button,
  buttons,
  press,
  visibleText,
  textStyles,
  act,
} from "./progress.cards.test.helpers";

jest.mock("@/shared/components/feedback/ToastViewport", () => ({
  ToastViewport: () => null,
}));

it.each(["lift", "navigation"])(
  "closes both card notes after switching %s and keeps them closed on return",
  async (change) => {
    const overview = analyzeCompetitionLifts([exposure(60)], atDay(60));
    const model = createProgressViewModel(overview, "bench");
    const props: ComponentProps<typeof ProgressScreenView> = {
      state: {
        status: "ready",
        selectedLift: "bench",
        overview,
        refresh: { status: "idle" },
      },
      isFocused: true,
      onSelectLift: jest.fn(),
      onRefresh: jest.fn(),
    };
    const renderer = await renderCard(createElement(ProgressScreenView, props));
    try {
      await press(button(renderer.root, "About this estimated max"));
      await press(button(renderer.root, "Why this benchmark is unavailable"));
      expect(visibleText(renderer.root)).toContain(model.status.estimateNote);
      expect(visibleText(renderer.root)).toContain(model.action.unavailable);
      const nextProps: ComponentProps<typeof ProgressScreenView> =
        change === "lift"
          ? { ...props, state: { ...props.state, selectedLift: "squat" } }
          : { ...props, isFocused: false };
      await act(async () => {
        renderer.update(createElement(ProgressScreenView, nextProps));
      });
      expect(visibleText(renderer.root)).not.toContain(
        model.status.estimateNote,
      );
      await act(async () => {
        renderer.update(createElement(ProgressScreenView, props));
      });
      expect(visibleText(renderer.root)).not.toContain(
        model.status.estimateNote,
      );
      expect(visibleText(renderer.root)).not.toContain(
        model.action.unavailable,
      );
      for (const label of [
        "About this estimated max",
        "Why this benchmark is unavailable",
      ]) {
        expect(button(renderer.root, label).props.accessibilityState).toEqual({
          expanded: false,
        });
      }
    } finally {
      await dispose(renderer);
    }
  },
);

it("keeps lift selection and dismisses analysis information with Android Back or a lift change", async () => {
  const onSelectLift = jest.fn();
  const renderer = await renderCard(
    createElement(ProgressScreenView, {
      state: {
        status: "ready",
        selectedLift: "bench",
        overview: baseOverview,
        refresh: { status: "idle" },
      },
      onSelectLift,
      onRefresh: jest.fn(),
    }),
  );
  try {
    const tabs = renderer.root.findAll(
      (node) => node.props.accessibilityRole === "tab",
      { deep: false },
    );
    expect(tabs).toHaveLength(3);
    expect(tabs.map((tab) => tab.props.accessibilityState)).toEqual([
      { selected: false },
      { selected: true },
      { selected: false },
    ]);
    await press(button(renderer.root, "How lift analysis works"));
    expect(visibleText(renderer.root)).toEqual(
      expect.arrayContaining(
        createProgressViewModel(baseOverview, "bench").methods,
      ),
    );
    await act(async () => {
      const close = renderer.root.findAllByType(Modal)[0].props.onRequestClose;
      if (typeof close !== "function") throw new Error("Missing Back handler");
      close();
    });
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
    await press(button(renderer.root, "How lift analysis works"));
    await press(tabs[0]);
    expect(onSelectLift).toHaveBeenCalledWith("squat");
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
  } finally {
    await dispose(renderer);
  }
});

it.each(["error", "pending"] as const)(
  "keeps an outdated snapshot's benchmark hidden during %s and restores it on successful refresh",
  async (status) => {
    const error = new Error("offline");
    const onRefresh = jest.fn();
    const props: ComponentProps<typeof ProgressScreenView> = {
      state: {
        status: "ready",
        selectedLift: "bench",
        overview: baseOverview,
        refresh:
          status === "error"
            ? { status, error }
            : { status, previousError: error },
      },
      onSelectLift: jest.fn(),
      onRefresh,
    };
    const renderer = await renderCard(createElement(ProgressScreenView, props));
    try {
      expect(
        createProgressViewModel(baseOverview, "bench").action.benchmark,
      ).not.toBeNull();
      await press(button(renderer.root, "Why this benchmark is unavailable"));
      expect(visibleText(renderer.root)).toContain(
        "These results are outdated. Refresh successfully to see a benchmark.",
      );
      expect(
        renderer.root.findAllByType(RefreshControl)[0].props.refreshing,
      ).toBe(status === "pending");
      const retry = buttons(renderer.root).find((node) =>
        visibleText(node).includes("Try Again"),
      );
      if (!retry) throw new Error("Missing refresh retry");
      await press(retry);
      expect(onRefresh).toHaveBeenCalledTimes(1);

      await act(async () => {
        renderer.update(
          createElement(ProgressScreenView, {
            ...props,
            state: { ...props.state, refresh: { status: "idle" } },
          }),
        );
      });
      expect(
        buttons(renderer.root).some(
          (node) =>
            node.props.accessibilityLabel ===
            "Why this benchmark is unavailable",
        ),
      ).toBe(false);
      expect(visibleText(renderer.root)).not.toContain(
        "These results are outdated. Refresh successfully to see a benchmark.",
      );
    } finally {
      await dispose(renderer);
    }
  },
);

it("keeps the active-workout action available", async () => {
  const onOpenActiveWorkout = jest.fn();
  const renderer = await renderCard(
    createElement(ProgressScreenView, {
      state: {
        status: "ready",
        selectedLift: "bench",
        overview: baseOverview,
        refresh: { status: "idle" },
      },
      onSelectLift: jest.fn(),
      onRefresh: jest.fn(),
      onOpenActiveWorkout,
    }),
  );
  try {
    await press(button(renderer.root, "Open active workout"));
    expect(onOpenActiveWorkout).toHaveBeenCalledTimes(1);
  } finally {
    await dispose(renderer);
  }
});

it("preserves evidence values, explanations, and badge colors", async () => {
  const model = cardModel(
    {},
    {
      performance: {
        ...baseOverview.lifts.bench.trends.performance,
        change: { status: "available", value: -5 },
      },
      effort: {
        ...baseOverview.lifts.bench.trends.effort,
        change: { status: "available", value: 1 },
      },
      hardSetsChange: { status: "available", value: 80 },
    },
  ).why;
  const renderer = await renderCard(
    createElement(WhyThisStatusCard, { model, onInfo: jest.fn() }),
  );
  try {
    expect(visibleText(renderer.root)).toEqual(
      expect.arrayContaining(
        model.rows.flatMap((row) => [
          row.label,
          row.value,
          ...(row.note ? [row.note] : []),
        ]),
      ),
    );
    expect(textStyles(renderer.root, "-5%")).toContainEqual(
      expect.objectContaining({ color: colors.error }),
    );
    expect(textStyles(renderer.root, "+1 RPE")).toContainEqual(
      expect.objectContaining({ color: colors.primarySoft }),
    );
    expect(textStyles(renderer.root, "+80%")).toContainEqual(
      expect.objectContaining({ color: colors.warning }),
    );
  } finally {
    await dispose(renderer);
  }
});

it("renders a Storybook retry scenario and completes its simulated refresh", async () => {
  const scenario = progressStoryScenarios.find(
    (entry) => entry.id === "refresh-retrying",
  );
  if (!scenario) throw new Error("Missing refresh scenario");
  const onRefresh = jest.fn();
  const renderer = await renderCard(
    createElement(ProgressStoryHost, { scenario, onRefresh }),
  );
  try {
    expect(
      button(renderer.root, "Why this benchmark is unavailable"),
    ).toBeDefined();
    expect(
      renderer.root.findAllByType(RefreshControl)[0].props.refreshing,
    ).toBe(true);
    await press(button(renderer.root, "Complete simulated refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(
      renderer.root.findAllByType(RefreshControl)[0].props.refreshing,
    ).toBe(false);
    expect(
      buttons(renderer.root).some(
        (node) =>
          node.props.accessibilityLabel === "Why this benchmark is unavailable",
      ),
    ).toBe(false);
  } finally {
    await dispose(renderer);
  }
});
