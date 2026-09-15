import type { BenchmarkTarget } from "@/domain/progress/benchmark/progress.benchmark.types";
import type { RecommendationKind } from "@/domain/progress/recommendation/progress.recommendation.types";

import { NextActionCard } from "../components/NextActionCard";

import {
  act,
  benchmark,
  cardModel,
  dispose,
  renderCard,
  visibleText,
} from "./progress.cards.test.helpers";

const actions = {
  continue_approach: {
    kind: "continue_approach",
    title: "KEEP YOUR CURRENT APPROACH",
    description:
      "Your recorded training supports maintaining your current approach. No meaningful adjustment is recommended.",
  },
  monitor: {
    kind: "monitor",
    title: "MONITOR BEFORE CHANGING YOUR PROGRAM",
    description:
      "Watch your next two comparable competition sessions before making a major adjustment.",
  },
  reduce_stress: {
    kind: "reduce_stress",
    title: "CONSIDER LOWERING TRAINING STRESS",
    description:
      "If your goal is to improve this lift, consider temporarily reducing hard competition work and reassessing with a lower-stress exposure.",
  },
  review_stimulus: {
    kind: "review_stimulus",
    title: "REVIEW YOUR RECENT WORKLOAD",
    description:
      "If your goal is to improve this lift, consider gradually returning toward previously productive workload. Change one variable at a time.",
  },
  restore_consistency: {
    kind: "restore_consistency",
    title: "REBUILD CONSISTENT EXPOSURES",
    description:
      "Keep logging comparable competition-lift sessions so RackRite can assess a continuous training period.",
  },
  gather_evidence: {
    kind: "gather_evidence",
    title: "KEEP LOGGING COMPARABLE SESSIONS",
    description:
      "Gather more comparable training history before making a major change. RPE is optional.",
  },
  reassess: {
    kind: "reassess",
    title: "REASSESS WITH A CONSERVATIVE BENCHMARK",
    description:
      "Performance has repeatedly declined. Review recent training and use a lower-stress comparable exposure before increasing demands.",
  },
} satisfies {
  [K in RecommendationKind]: { kind: K; title: string; description: string };
};

it.each(Object.values(actions))(
  "renders $kind advice without an invented benchmark",
  async ({ kind, title, description }) => {
    const model = cardModel({
      recommendation: { kind, reasons: [], benchmark: null },
    }).action;
    const renderer = await renderCard(<NextActionCard model={model} />);
    try {
      const text = visibleText(renderer.root);
      expect(text).toEqual(
        expect.arrayContaining(["NEXT ACTION", title, description]),
      );
      expect(text).not.toContain("NEXT PERFORMANCE TARGET");
      expect(text).not.toContain("NEXT BENCHMARK");
      expect(text.some((value) => value.startsWith("TARGET RPE"))).toBe(false);
    } finally {
      await dispose(renderer);
    }
  },
);

const intents = {
  progress: {
    intent: "progress",
    label: "NEXT PERFORMANCE TARGET",
    explanation:
      "A small increase supported by repeated performance and recorded effort.",
  },
  repeat: {
    intent: "repeat",
    label: "NEXT BENCHMARK",
    explanation: "Repeat a familiar workload to keep the comparison useful.",
  },
  reduce_stress: {
    intent: "reduce_stress",
    label: "NEXT BENCHMARK",
    explanation:
      "A lower-stress exposure for comparison; this is not a complete workout.",
  },
} satisfies {
  [K in BenchmarkTarget["intent"]]: {
    intent: K;
    label: string;
    explanation: string;
  };
};

it.each(Object.values(intents))(
  "renders a $intent benchmark with supported RPE",
  async ({ intent, label, explanation }) => {
    const target = benchmark({
      intent,
      weight: intent === "reduce_stress" ? 92.5 : 102.5,
    });
    const model = cardModel({
      recommendation: {
        kind:
          intent === "reduce_stress" ? "reduce_stress" : "continue_approach",
        reasons: [],
        benchmark: target,
      },
    }).action;
    const renderer = await renderCard(<NextActionCard model={model} />);
    try {
      expect(visibleText(renderer.root)).toEqual(
        expect.arrayContaining([
          label,
          intent === "reduce_stress" ? "92.5 KG × 3" : "102.5 KG × 3",
          "TARGET RPE 7–8",
          explanation,
        ]),
      );
    } finally {
      await dispose(renderer);
    }
  },
);

it("preserves off-grid repeat loads and explains missing effort without an RPE badge", async () => {
  const model = cardModel({
    recommendation: {
      kind: "monitor",
      reasons: [],
      benchmark: benchmark({
        intent: "repeat",
        weight: 101.25,
        rpe: null,
        reason: "effort_headroom_unknown",
      }),
    },
  }).action;
  const renderer = await renderCard(<NextActionCard model={model} />);
  try {
    expect(visibleText(renderer.root)).toEqual(
      expect.arrayContaining([
        "101.25 KG × 3",
        "Repeat a familiar workload. Effort headroom is unknown without RPE.",
      ]),
    );
    expect(
      visibleText(renderer.root).some((value) =>
        value.startsWith("TARGET RPE"),
      ),
    ).toBe(false);
  } finally {
    await dispose(renderer);
  }
});

it("removes the previous load, effort badge and explanation when the benchmark disappears", async () => {
  const recommendation = {
    kind: "continue_approach" as const,
    reasons: [],
    benchmark: benchmark(),
  };
  const renderer = await renderCard(
    <NextActionCard model={cardModel({ recommendation }).action} />,
  );
  try {
    expect(visibleText(renderer.root)).toContain("102.5 KG × 3");
    await act(async () => {
      renderer.update(
        <NextActionCard
          model={
            cardModel({
              recommendation: { ...recommendation, benchmark: null },
            }).action
          }
        />,
      );
    });
    const text = visibleText(renderer.root);
    for (const removed of [
      "102.5 KG × 3",
      "TARGET RPE 7–8",
      "NEXT PERFORMANCE TARGET",
      intents.progress.explanation,
    ])
      expect(text).not.toContain(removed);
    expect(text).toContain("KEEP YOUR CURRENT APPROACH");
  } finally {
    await dispose(renderer);
  }
});
