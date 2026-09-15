import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";
import { colors } from "@/shared/theme/tokens";

import { PerformanceTrendCard } from "../components/PerformanceTrendCard";
import { createProgressViewModel } from "../progress.viewModel";

import {
  baseAnalysis,
  button,
  buttons,
  dispose,
  overviewWith,
  press,
  renderCard,
  textStyles,
  viewStyles,
  visibleText,
} from "./progress.cards.test.helpers";

const metrics = {
  performance: {
    metric: "performance",
    title: "PERFORMANCE TREND",
    basis:
      "Based on load and repetitions · Index 100 = earlier comparison period",
    unit: "index",
  },
  e1rm: {
    metric: "e1rm",
    title: "ESTIMATED 1RM TREND",
    basis: "Estimated from load and repetitions",
    unit: "kg estimated 1RM",
  },
  volume: {
    metric: "volume",
    title: "COMPETITION VOLUME",
    basis: "Completed non-warmup competition sets",
    unit: "kg volume",
  },
} satisfies {
  [K in TrendMetric]: { metric: K; title: string; basis: string; unit: string };
};

function overviewForValues(values: (number | null)[]) {
  return overviewWith(
    {},
    {
      basis: "load_reps",
      performance: {
        ...baseAnalysis.trends.performance,
        baseline: 100,
        change: { status: "available", value: 2.5 },
      },
      raw: {
        ...baseAnalysis.trends.raw,
        change: { status: "available", value: 2.5 },
      },
      volumeChange: { status: "available", value: 2.5 },
      weekly: baseAnalysis.trends.weekly.map((week, index) => ({
        ...week,
        raw: values[index] ?? null,
        adjusted: null,
        volume: values[index] ?? null,
      })),
    },
  );
}

it.each(Object.values(metrics))(
  "renders $metric labels, units and actual values on bar selection",
  async ({ metric, title, basis, unit }) => {
    const model = createProgressViewModel(
      overviewForValues(Array(8).fill(100)),
      "bench",
      metric,
    ).chart;
    const renderer = await renderCard(<PerformanceTrendCard model={model} />);
    try {
      expect(visibleText(renderer.root)).toEqual(
        expect.arrayContaining([
          title,
          basis,
          "LAST 8 WEEKS",
          "6W +2.5%",
          "W8*",
          "Eight calendar weeks. * Current week is incomplete.",
        ]),
      );
      const bars = buttons(renderer.root);
      expect(bars).toHaveLength(8);
      const label = bars[7].props.accessibilityLabel;
      expect(label).toEqual(
        expect.stringMatching(new RegExp(`: 100 ${unit} · Incomplete week$`)),
      );
      expect(label).toEqual(
        expect.stringMatching(/^[A-Z][a-z]+ \d+–[A-Z][a-z]+ \d+:/),
      );
      await press(bars[7]);
      expect(visibleText(renderer.root)).toContain(label);
      expect(buttons(renderer.root)[7].props.accessibilityState).toEqual({
        selected: true,
      });
      expect(viewStyles(renderer.root)).toContainEqual(
        expect.objectContaining({ borderStyle: "dashed" }),
      );
    } finally {
      await dispose(renderer);
    }
  },
);

it("explains effort-adjusted performance and leaves missing adjusted weeks empty", async () => {
  const overview = overviewForValues(Array(8).fill(100));
  const analysis = overview.lifts.bench;
  const model = createProgressViewModel(
    {
      ...overview,
      lifts: {
        ...overview.lifts,
        bench: {
          ...analysis,
          trends: {
            ...analysis.trends,
            basis: "effort_adjusted",
            weekly: analysis.trends.weekly.map((week, index) => ({
              ...week,
              adjusted: index === 0 ? 120 : null,
            })),
          },
        },
      },
    },
    "bench",
    "performance",
  ).chart;
  const renderer = await renderCard(<PerformanceTrendCard model={model} />);
  try {
    expect(visibleText(renderer.root)).toContain(
      "Includes recorded effort · Index 100 = earlier comparison period",
    );
    expect(
      visibleText(renderer.root).filter((value) => value === "—"),
    ).toHaveLength(7);
    const label = model.points[0].description;
    expect(label).toContain("120 index");
    await press(button(renderer.root, label));
    expect(visibleText(renderer.root)).toContain(label);
  } finally {
    await dispose(renderer);
  }
});

it.each([
  { change: 2, label: "6W +2%", color: colors.success },
  { change: -3, label: "6W -3%", color: colors.error },
  { change: 0, label: "6W 0%", color: colors.muted },
  { change: null, label: "BUILDING HISTORY", color: colors.primarySoft },
])(
  "renders $label with a semantic delta color",
  async ({ change, label, color }) => {
    const model = createProgressViewModel(
      overviewWith(
        {},
        {
          raw: {
            ...baseAnalysis.trends.raw,
            change:
              change === null
                ? { status: "unavailable", reason: "insufficient_history" }
                : { status: "available", value: change },
          },
        },
      ),
      "bench",
      "e1rm",
    ).chart;
    const renderer = await renderCard(<PerformanceTrendCard model={model} />);
    try {
      expect(visibleText(renderer.root)).toContain(label);
      expect(textStyles(renderer.root, label)).toContainEqual(
        expect.objectContaining({ color }),
      );
    } finally {
      await dispose(renderer);
    }
  },
);

it.each([
  {
    metric: "performance" as const,
    message:
      "More history is needed for a comparison baseline. View E1RM for early estimates.",
  },
  {
    metric: "e1rm" as const,
    message: "No eligible performance points in these weeks.",
  },
  {
    metric: "volume" as const,
    message: "No eligible competition volume in these weeks.",
  },
])(
  "renders the empty $metric explanation without fabricated bars",
  async ({ metric, message }) => {
    const overview = overviewWith(
      {},
      {
        weekly: baseAnalysis.trends.weekly.map((week) => ({
          ...week,
          raw: null,
          adjusted: null,
          volume: null,
        })),
        performance: { ...baseAnalysis.trends.performance, baseline: null },
      },
    );
    const renderer = await renderCard(
      <PerformanceTrendCard
        model={createProgressViewModel(overview, "bench", metric).chart}
      />,
    );
    try {
      expect(visibleText(renderer.root)).toContain(message);
      expect(buttons(renderer.root)).toHaveLength(0);
    } finally {
      await dispose(renderer);
    }
  },
);

it.each([
  {
    name: "single point",
    values: [100, null, null, null, null, null, null, null],
    gaps: 7,
  },
  {
    name: "missing weeks",
    values: [100, null, 102, null, 101, null, 104, null],
    gaps: 4,
  },
  { name: "equal values", values: Array(8).fill(100), gaps: 0 },
  { name: "zero volume", values: Array(8).fill(0), gaps: 0 },
  {
    name: "extreme values",
    values: [1, 1e300, null, null, null, null, null, null],
    gaps: 6,
  },
])(
  "renders $name without treating valid zero as missing",
  async ({ values, gaps }) => {
    const model = createProgressViewModel(
      overviewForValues(values),
      "bench",
      "volume",
    ).chart;
    const renderer = await renderCard(<PerformanceTrendCard model={model} />);
    try {
      expect(buttons(renderer.root)).toHaveLength(8);
      expect(
        visibleText(renderer.root).filter((value) => value === "—"),
      ).toHaveLength(gaps);
      expect(visibleText(renderer.root)).not.toContain(
        "No eligible competition volume in these weeks.",
      );
      expect(textStyles(renderer.root, "6W +2.5%")).toContainEqual(
        expect.objectContaining({ color: colors.primarySoft }),
      );
      const heights = viewStyles(renderer.root).flatMap((style) =>
        typeof style.height === "string" && style.height.endsWith("%")
          ? [Number.parseFloat(style.height)]
          : [],
      );
      expect(heights).toHaveLength(8 - gaps);
      expect(
        heights.every(
          (height) => Number.isFinite(height) && height >= 0 && height <= 100,
        ),
      ).toBe(true);
      await press(button(renderer.root, model.points[0].description));
      expect(visibleText(renderer.root)).toContain(model.points[0].description);
    } finally {
      await dispose(renderer);
    }
  },
);
