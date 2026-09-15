import * as OverviewStories from "../Overview.stories";
import * as LiftStatusStories from "../LiftStatus.stories";
import * as EvidenceStories from "../Evidence.stories";
import * as LearningExplanationsStories from "../LearningExplanations.stories";
import * as DiagnosisStories from "../Diagnosis.stories";
import * as RecommendationsStories from "../Recommendations.stories";
import * as BenchmarksStories from "../Benchmarks.stories";
import * as UnavailableMeasurementsStories from "../UnavailableMeasurements.stories";
import * as EvidenceBarsStories from "../EvidenceBars.stories";
import * as ChartsStories from "../Charts.stories";
import * as RefreshStories from "../Refresh.stories";
import { Modal } from "react-native";
import { ProgressScreenView } from "@/features/progress/view/ProgressScreenView";
import { LiftStatusCard } from "@/features/progress/view/components/LiftStatusCard";
import { NextActionCard } from "@/features/progress/view/components/NextActionCard";
import { WhyThisStatusCard } from "@/features/progress/view/components/WhyThisStatusCard";
import { PerformanceTrendCard } from "@/features/progress/view/components/PerformanceTrendCard";
import { createProgressViewModel } from "@/features/progress/view/progress.viewModel";
import {
  act,
  button,
  buttons,
  dispose,
  press,
  renderCard,
  visibleText,
} from "@/features/progress/view/tests/progress.cards.test.helpers";
import { ProgressStoryHost } from "../ProgressStoryHost";
import { progressStoryScenarios } from "../progressStory.scenarios";

jest.mock("@/shared/components/feedback/ToastViewport", () => ({
  ToastViewport: () => null,
}));

it("has unique stable catalog keys and complete finite category coverage", () => {
  const ids = progressStoryScenarios.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const [prefix, expected] of [
    [
      "status-",
      [
        "learning",
        "progressing",
        "stable",
        "stalling",
        "plateaued",
        "regressing",
      ],
    ],
    ["evidence-", ["weak", "moderate", "strong"]],
    [
      "diagnosis-",
      [
        "none",
        "fatigue",
        "insufficient_stimulus",
        "excessive_intensity",
        "inconsistent_training",
        "insufficient_evidence",
      ],
    ],
    [
      "action-",
      [
        "continue_approach",
        "monitor",
        "reduce_stress",
        "review_stimulus",
        "restore_consistency",
        "gather_evidence",
        "reassess",
      ],
    ],
  ] as const)
    expect(ids.filter((id) => id.startsWith(prefix)).sort()).toEqual(
      expected.map((key) => `${prefix}${key}`).sort(),
    );
});

it.each(progressStoryScenarios)(
  "renders all real cards for $id with usable models for every lift/metric",
  async (scenario) => {
    const before = JSON.stringify(scenario.overview);
    for (const family of ["squat", "bench", "deadlift"] as const) {
      for (const metric of ["performance", "e1rm", "volume"] as const) {
        const model = createProgressViewModel(
          scenario.overview,
          family,
          metric,
        );
        expect(model.why.rows.map((r) => r.id)).toEqual([
          "performance",
          "e1rm",
          "rpe",
          "volume",
        ]);
        expect(model.chart.points).toHaveLength(8);
        for (const point of model.chart.points) {
          expect(
            point.value === null ||
              (Number.isFinite(point.value) && point.value >= 0),
          ).toBe(true);
        }
      }
    }
    const renderer = await renderCard(
      <ProgressScreenView
        state={{
          status: "ready",
          selectedLift: "bench",
          metric: scenario.metric ?? "performance",
          overview: scenario.overview,
          refresh: { status: "idle" },
        }}
        onRefresh={() => {}}
        onSelectLift={() => {}}
        onSelectMetric={() => {}}
      />,
    );
    try {
      for (const Card of [
        LiftStatusCard,
        NextActionCard,
        WhyThisStatusCard,
        PerformanceTrendCard,
      ])
        expect(renderer.root.findAllByType(Card)).toHaveLength(1);
      expect(
        visibleText(renderer.root).some((s) =>
          /NaN|undefined|Infinity/.test(s),
        ),
      ).toBe(false);
      expect(JSON.stringify(scenario.overview)).toBe(before);
    } finally {
      await dispose(renderer);
    }
  },
);

it("restores stale targets on retry and resets local preview state when changing scenarios", async () => {
  const renderer = await renderCard(
    <ProgressStoryHost scenario={scenarioById("stale")} />,
  );
  async function select(id: string) {
    const scenario = progressStoryScenarios.find((s) => s.id === id);
    if (!scenario) throw new Error(`Missing scenario ${id}`);
    await act(async () => {
      renderer.update(<ProgressStoryHost scenario={scenario} />);
    });
  }
  try {
    await select("stale");
    expect(visibleText(renderer.root)).not.toContain("102.5 KG × 3");
    const retry = buttons(renderer.root).find((node) =>
      visibleText(node).includes("Try Again"),
    );
    if (!retry) throw new Error("Missing retry button");
    await press(retry);
    expect(visibleText(renderer.root)).toContain("102.5 KG × 3");
    await press(
      buttons(renderer.root.findAllByType(PerformanceTrendCard)[0])[0],
    );
    await select("empty");
    await select("stale");
    expect(visibleText(renderer.root)).not.toContain("102.5 KG × 3");
    const bars = buttons(renderer.root.findAllByType(PerformanceTrendCard)[0]);
    expect(
      bars.every(
        (bar) =>
          JSON.stringify(bar.props.accessibilityState) === '{"selected":false}',
      ),
    ).toBe(true);
  } finally {
    await dispose(renderer);
  }
});

it.each(["refresh-pending", "refresh-retrying"])(
  "holds %s until explicitly completed",
  async (id) => {
    const renderer = await renderCard(
      <ProgressStoryHost scenario={scenarioById(id)} />,
    );
    try {
      const screen = renderer.root.findAllByType(ProgressScreenView)[0];
      expect(screen.props.state).toEqual(
        expect.objectContaining({
          refresh: expect.objectContaining({ status: "pending" }),
        }),
      );
      if (id === "refresh-retrying")
        expect(visibleText(renderer.root)).not.toContain("102.5 KG × 3");
      else expect(visibleText(renderer.root)).toContain("102.5 KG × 3");
      await press(button(renderer.root, "Complete simulated refresh"));
      expect(visibleText(renderer.root)).toContain("102.5 KG × 3");
      expect(
        renderer.root.findAllByType(ProgressScreenView)[0].props.state,
      ).toEqual(expect.objectContaining({ refresh: { status: "idle" } }));
    } finally {
      await dispose(renderer);
    }
  },
);

function scenarioById(id: string) {
  const scenario = progressStoryScenarios.find((entry) => entry.id === id);
  if (!scenario) throw new Error(`Unknown test scenario: ${id}`);
  return scenario;
}

it("resets selectors and closes the methods sheet when changing stories", async () => {
  const onSelectLift = jest.fn();
  const onSelectMetric = jest.fn();
  const renderer = await renderCard(
    <ProgressStoryHost
      scenario={scenarioById("recorded")}
      onSelectLift={onSelectLift}
      onSelectMetric={onSelectMetric}
    />,
  );
  try {
    await act(async () => {
      const screen = renderer.root.findAllByType(ProgressScreenView)[0];
      (screen.props.onSelectLift as (lift: "squat") => void)("squat");
      (screen.props.onSelectMetric as (metric: "volume") => void)("volume");
    });
    expect(onSelectLift).toHaveBeenCalledWith("squat");
    expect(onSelectMetric).toHaveBeenCalledWith("volume");
    await press(button(renderer.root, "How lift analysis works"));
    expect(renderer.root.findAllByType(Modal)).toHaveLength(1);
    await act(async () => {
      renderer.update(<ProgressStoryHost scenario={scenarioById("early")} />);
    });
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
    expect(
      renderer.root.findAllByType(ProgressScreenView)[0].props.state,
    ).toEqual(
      expect.objectContaining({ selectedLift: "bench", metric: "e1rm" }),
    );
    await press(button(renderer.root, "How lift analysis works"));
    await act(async () => {
      const modal = renderer.root.findAllByType(Modal)[0];
      (modal.props.onRequestClose as () => void)();
    });
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);
  } finally {
    await dispose(renderer);
  }
});

it("applies changed initial selector controls without retaining the old selection", async () => {
  const scenario = scenarioById("recorded");
  const renderer = await renderCard(<ProgressStoryHost scenario={scenario} />);
  try {
    await act(async () => {
      renderer.update(
        <ProgressStoryHost
          scenario={scenario}
          initialLift="deadlift"
          initialMetric="volume"
        />,
      );
    });
    expect(
      renderer.root.findAllByType(ProgressScreenView)[0].props.state,
    ).toEqual(
      expect.objectContaining({ selectedLift: "deadlift", metric: "volume" }),
    );
  } finally {
    await dispose(renderer);
  }
});

it("registers every scenario exactly once with its category and notes", () => {
  const modules = [
    OverviewStories,
    LiftStatusStories,
    EvidenceStories,
    LearningExplanationsStories,
    DiagnosisStories,
    RecommendationsStories,
    BenchmarksStories,
    UnavailableMeasurementsStories,
    EvidenceBarsStories,
    ChartsStories,
    RefreshStories,
  ];
  const ids: string[] = [];
  for (const { default: meta, ...stories } of modules) {
    for (const story of Object.values(stories)) {
      const scenario = story.args?.scenario;
      if (!scenario) throw new Error("Story is missing its scenario");
      expect(meta.title).toBe(`Progress/${scenario.group}`);
      expect(story.name).toBe(scenario.title);
      expect(story.parameters?.notes).toBe(scenario.description);
      ids.push(scenario.id);
    }
  }
  expect(ids.sort()).toEqual(progressStoryScenarios.map((s) => s.id).sort());
});
