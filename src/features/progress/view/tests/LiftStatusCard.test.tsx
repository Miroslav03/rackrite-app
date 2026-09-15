import type { LiftFamily } from "@/domain/domain.types";
import type { EvidenceLevel } from "@/domain/progress/evidence/progress.evidence.types";
import type { LiftStatus } from "@/domain/progress/status/progress.status.types";

import { colors } from "@/shared/theme/tokens";

import { LiftStatusCard } from "../components/LiftStatusCard";
import { createProgressViewModel } from "../progress.viewModel";

import {
  act,
  baseAnalysis,
  baseOverview,
  cardModel,
  dispose,
  renderCard,
  textStyles,
  viewStyles,
  visibleText,
} from "./progress.cards.test.helpers";

const statuses = {
  learning: {
    label: "LEARNING",
    color: colors.muted,
    summary: "No recent completed competition sessions yet.",
  },
  progressing: {
    label: "PROGRESSING",
    color: colors.success,
    summary: "Your bench performance appears to be improving consistently.",
  },
  stable: {
    label: "STABLE",
    color: colors.primarySoft,
    summary:
      "Your recent bench performance is holding steady. Maintaining strength can be intentional.",
  },
  stalling: {
    label: "STALLING",
    color: colors.warning,
    summary:
      "Your bench progress appears to be slowing across recent sessions.",
  },
  plateaued: {
    label: "PLATEAUED",
    color: colors.warning,
    summary:
      "Your recorded bench performance has shown no meaningful progression across the recent training period.",
  },
  regressing: {
    label: "REGRESSING",
    color: colors.errorBorder,
    summary:
      "Recent bench performance is consistently below your earlier baseline.",
  },
} satisfies Record<
  LiftStatus,
  { label: string; color: string; summary: string }
>;

it.each(Object.entries(statuses))(
  "renders %s with its explanation and semantic accent",
  async (value, expected) => {
    const status = Object.keys(statuses).find(
      (key): key is LiftStatus => key === value,
    );
    if (!status) throw new Error("Missing status fixture");
    const model = cardModel({
      status: {
        value: status,
        reason: status === "learning" ? "no_history" : "confirmed_trend",
        confirmed: status !== "learning",
      },
    }).status;
    const renderer = await renderCard(<LiftStatusCard model={model} />);
    try {
      expect(visibleText(renderer.root)).toEqual(
        expect.arrayContaining([expected.label, expected.summary]),
      );
      expect(textStyles(renderer.root, expected.label)).toContainEqual(
        expect.objectContaining({ color: expected.color }),
      );
      expect(viewStyles(renderer.root)).toContainEqual(
        expect.objectContaining({
          borderLeftColor: expected.color,
          borderLeftWidth: 4,
        }),
      );
    } finally {
      await dispose(renderer);
    }
  },
);

const evidenceLabels = {
  weak: "WEAK EVIDENCE",
  moderate: "MODERATE EVIDENCE",
  strong: "STRONG EVIDENCE",
} satisfies Record<EvidenceLevel, string>;
it.each(Object.entries(evidenceLabels))(
  "renders %s evidence",
  async (level, expected) => {
    const model = cardModel().status;
    const renderer = await renderCard(
      <LiftStatusCard model={{ ...model, evidence: expected }} />,
    );
    try {
      expect(visibleText(renderer.root)).toContain(expected);
    } finally {
      await dispose(renderer);
    }
  },
);

const families = {
  squat: "SQUAT",
  bench: "BENCH PRESS",
  deadlift: "DEADLIFT",
} satisfies Record<LiftFamily, string>;
it.each(["squat", "bench", "deadlift"] as const)(
  "renders the %s title",
  async (family) => {
    const renderer = await renderCard(
      <LiftStatusCard
        model={
          createProgressViewModel(baseOverview, family, "performance").status
        }
      />,
    );
    try {
      expect(visibleText(renderer.root)).toContain(families[family]);
    } finally {
      await dispose(renderer);
    }
  },
);

it.each([
  { change: 2.56, expected: "+2.6%" },
  { change: -3.24, expected: "-3.2%" },
  { change: 0, expected: "0%" },
  { change: null, expected: "—" },
])(
  "renders performance $expected with the correct metric labels",
  async ({ change, expected }) => {
    const model = cardModel(
      {
        currentEstimatedMax: { status: "available", value: 112.56 },
        analyzedSessionCount: 12,
      },
      {
        performance: {
          ...baseAnalysis.trends.performance,
          change:
            change === null
              ? { status: "unavailable", reason: "insufficient_history" }
              : { status: "available", value: change },
        },
      },
    ).status;
    const renderer = await renderCard(<LiftStatusCard model={model} />);
    try {
      expect(visibleText(renderer.root)).toEqual(
        expect.arrayContaining([
          expected,
          "112.6",
          "12",
          "6-WEEK PERF",
          "EST. 1RM - KG",
          "SESSIONS - 8 WEEKS",
        ]),
      );
    } finally {
      await dispose(renderer);
    }
  },
);

it("shows unavailable estimates and zero sessions without presenting them as a zero max", async () => {
  const model = createProgressViewModel(
    baseOverview,
    "squat",
    "performance",
  ).status;
  const renderer = await renderCard(<LiftStatusCard model={model} />);
  try {
    expect(
      visibleText(renderer.root).filter((text) => text === "—"),
    ).toHaveLength(2);
    expect(visibleText(renderer.root)).toContain("0");
    expect(visibleText(renderer.root)).not.toContain(
      "Early estimate from limited history",
    );
  } finally {
    await dispose(renderer);
  }
});

it("removes the early-history note when more performance days arrive", async () => {
  const model = cardModel(
    {},
    { contextDays: baseAnalysis.trends.contextDays.slice(0, 1) },
  ).status;
  const renderer = await renderCard(<LiftStatusCard model={model} />);
  try {
    expect(visibleText(renderer.root)).toContain(
      "Early estimate from limited history",
    );
    await act(async () => {
      renderer.update(<LiftStatusCard model={cardModel().status} />);
    });
    expect(visibleText(renderer.root)).not.toContain(
      "Early estimate from limited history",
    );
  } finally {
    await dispose(renderer);
  }
});
