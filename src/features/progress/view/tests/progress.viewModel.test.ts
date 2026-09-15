import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import type { DiagnosisKind } from "@/domain/progress/diagnosis/progress.diagnosis.types";
import type { UnavailableReason } from "@/domain/progress/measurements/progress.measurements.types";
import type {
  LiftStatus,
  StatusReason,
} from "@/domain/progress/status/progress.status.types";
import {
  atDay,
  exposure,
  series,
} from "@/domain/progress/tests/progress.test.helpers";

import { colors } from "@/shared/theme/tokens";

import { createProgressViewModel, formatChange } from "../progress.viewModel";

import {
  baseAnalysis,
  benchmark,
  cardModel,
  overviewWith,
} from "./progress.cards.test.helpers";

const overview = analyzeCompetitionLifts(
  series(Array(16).fill(100)),
  atDay(60),
);

it.each<LiftStatus>([
  "learning",
  "progressing",
  "stable",
  "stalling",
  "plateaued",
  "regressing",
])("formats %s and all three accessible selector statuses", (status) => {
  const input = {
    ...overview,
    lifts: {
      ...overview.lifts,
      bench: {
        ...overview.lifts.bench,
        status: { ...overview.lifts.bench.status, value: status },
      },
    },
  };
  const model = createProgressViewModel(input, "bench", "performance");

  expect(model.status.label).toBe(status.toUpperCase());
  expect(model.selector.map((option) => option.value)).toEqual([
    "squat",
    "bench",
    "deadlift",
  ]);
  expect(model.status.summary.length).toBeGreaterThan(20);
});

it.each<DiagnosisKind>([
  "none",
  "fatigue",
  "excessive_intensity",
  "insufficient_stimulus",
  "inconsistent_training",
  "insufficient_evidence",
])("formats the %s diagnosis as evidence rather than certainty", (kind) => {
  const input = {
    ...overview,
    lifts: {
      ...overview.lifts,
      bench: {
        ...overview.lifts.bench,
        diagnosis: { ...overview.lifts.bench.diagnosis, kind },
      },
    },
  };

  expect(
    createProgressViewModel(input, "bench", "e1rm").why.diagnosis === null,
  ).toBe(kind === "none");
});

it("keeps the four evidence rows with explicit unavailable reasons", () => {
  const model = createProgressViewModel(
    analyzeCompetitionLifts([], atDay(60)),
    "bench",
    "performance",
  );

  expect(model.why.rows).toHaveLength(4);
  expect(
    model.why.rows.every(
      (row) => row.value === "—" && row.note && row.fraction === null,
    ),
  ).toBe(true);
  expect(model.action.benchmark).toBeNull();
  expect(model.chart.points.every((point) => point.value === null)).toBe(true);
});

it("hides benchmarks when the retained snapshot is outdated", () => {
  expect(
    createProgressViewModel(overview, "bench", "performance").action.benchmark,
  ).not.toBeNull();
  expect(
    createProgressViewModel(overview, "bench", "performance", true).action
      .benchmark,
  ).toBeNull();
});

it("keeps effort and volume neutral, and clamps bars without hiding exact changes", () => {
  const input = {
    ...overview,
    lifts: {
      ...overview.lifts,
      bench: {
        ...overview.lifts.bench,
        trends: {
          ...overview.lifts.bench.trends,
          volumeChange: { status: "available" as const, value: 80 },
          rpeChange: { status: "available" as const, value: 1 },
        },
      },
    },
  };
  const rows = createProgressViewModel(input, "bench", "volume").why.rows;

  expect(rows[3]).toMatchObject({
    value: "+80%",
    fraction: 1,
    color: colors.primarySoft,
  });
  expect(rows[2].color).toBe(colors.primarySoft);
});

it("labels eight weeks, incomplete current weeks and six-week deltas", () => {
  const model = createProgressViewModel(overview, "bench", "volume");

  expect(model.chart.points).toHaveLength(8);
  expect(model.chart.points[7]).toMatchObject({ partial: true });
  expect(model.chart.points[7].description).toContain("Incomplete week");
  expect(model.chart.delta).toMatch(/^6W/);
});

it("shows a single E1RM point without inventing a normalized performance baseline", () => {
  const input = analyzeCompetitionLifts([exposure(60)], atDay(60));

  expect(
    createProgressViewModel(input, "bench", "performance").chart.points.every(
      (point) => point.value === null,
    ),
  ).toBe(true);
  expect(
    createProgressViewModel(input, "bench", "e1rm").chart.points.filter(
      (point) => point.value !== null,
    ),
  ).toHaveLength(1);
});

it("normalizes displayed negative zero", () => {
  expect(formatChange(-0.001)).toBe("0%");
});

const learningReasons = {
  no_history: "No recent completed competition sessions yet.",
  no_performance:
    "Your recorded sessions do not yet contain eligible competition performance sets.",
  insufficient_history:
    "RackRite needs more comparable sessions across several weeks.",
  stale_history:
    "Your last eligible performance is over three weeks old. Log recent sessions to rebuild the picture.",
  training_gap: "You're rebuilding comparable history after a training gap.",
  ambiguous_identity:
    "Competition exercise identities conflict in this history. RackRite cannot reliably combine them.",
  conflicting_signals:
    "Load and effort signals disagree. More comparable sessions will help clarify the trend.",
  confirming_change: "RackRite is waiting for repeated evidence.",
  confirmed_trend: "RackRite is learning your performance.",
} satisfies Record<StatusReason, string>;

it.each(Object.entries(learningReasons))(
  "explains the Learning reason %s",
  (reason, expected) => {
    const key = Object.keys(learningReasons).find(
      (key): key is StatusReason => key === reason,
    );
    if (!key) throw new Error("Missing learning reason fixture");
    expect(
      cardModel({
        status: { value: "learning", reason: key, confirmed: false },
      }).status.summary,
    ).toBe(expected);
  },
);

const unavailableReasons = {
  no_history: "No recent sessions",
  no_performance: "No eligible performance sets",
  insufficient_history: "More comparable sessions needed",
  missing_rpe: "RPE not recorded",
  partial_rpe: "Partial RPE history",
  invalid_baseline: "No valid comparison baseline",
  incomplete_period: "More complete weeks needed",
} satisfies Record<UnavailableReason, string>;

it.each(Object.entries(unavailableReasons))(
  "preserves unavailable reason %s instead of displaying zero",
  (reason, expected) => {
    const key = Object.keys(unavailableReasons).find(
      (key): key is UnavailableReason => key === reason,
    );
    if (!key) throw new Error("Missing unavailable reason fixture");
    const row = cardModel(
      {},
      { rpeChange: { status: "unavailable", reason: key } },
    ).why.rows[2];
    expect(row).toMatchObject({
      value: "—",
      note: expected,
      fraction: null,
      direction: "",
      color: colors.muted,
    });
  },
);

it.each([
  {
    values: [5, 5, 1, 25],
    fraction: 0.5,
    text: ["+5%", "+5%", "+1", "+25%"],
    direction: "↑",
  },
  {
    values: [-5, -5, -1, -25],
    fraction: -0.5,
    text: ["-5%", "-5%", "-1", "-25%"],
    direction: "↓",
  },
  {
    values: [10, 10, 2, 50],
    fraction: 1,
    text: ["+10%", "+10%", "+2", "+50%"],
    direction: "↑",
  },
  {
    values: [-10, -10, -2, -50],
    fraction: -1,
    text: ["-10%", "-10%", "-2", "-50%"],
    direction: "↓",
  },
  {
    values: [15, 15, 3, 75],
    fraction: 1,
    text: ["+15%", "+15%", "+3", "+75%"],
    direction: "↑",
  },
  {
    values: [-15, -15, -3, -75],
    fraction: -1,
    text: ["-15%", "-15%", "-3", "-75%"],
    direction: "↓",
  },
  {
    values: [0, 0, 0, 0],
    fraction: 0,
    text: ["0%", "0%", "0", "0%"],
    direction: "−",
  },
])(
  "uses the disclosed scales for $values, clamping only the graphical fraction",
  ({ values, fraction, text, direction }) => {
    const rows = cardModel(
      {},
      {
        performance: {
          ...baseAnalysis.trends.performance,
          change: { status: "available", value: values[0] },
        },
        raw: {
          ...baseAnalysis.trends.raw,
          change: { status: "available", value: values[1] },
        },
        rpeChange: { status: "available", value: values[2] },
        volumeChange: { status: "available", value: values[3] },
      },
    ).why.rows;
    expect(rows.map((row) => row.value)).toEqual(text);
    for (const row of rows)
      expect(row).toMatchObject({ fraction, direction, note: null });
    expect(rows.slice(2).map((row) => row.color)).toEqual([
      colors.primarySoft,
      colors.primarySoft,
    ]);
  },
);

it.each([
  { value: -0.001, expected: "0%" },
  { value: 0.049, expected: "0%" },
  { value: -0.049, expected: "0%" },
  { value: 0.05, expected: "+0.1%" },
  { value: -0.05, expected: "-0.1%" },
  { value: 2.56, expected: "+2.6%" },
])(
  "formats the rounding boundary $value as $expected",
  ({ value, expected }) => {
    expect(formatChange(value)).toBe(expected);
  },
);

it.each([
  { level: "weak" as const, expected: "WEAK EVIDENCE" },
  { level: "moderate" as const, expected: "MODERATE EVIDENCE" },
  { level: "strong" as const, expected: "STRONG EVIDENCE" },
])(
  "formats $level status evidence independently of diagnosis evidence",
  ({ level, expected }) => {
    const model = cardModel({
      evidence: { ...baseAnalysis.evidence, level },
      diagnosis: {
        kind: "fatigue",
        evidence: "moderate",
        reasons: [],
        referenceWindow: null,
      },
    });
    expect(model.status.evidence).toBe(expected);
    expect(model.why.diagnosis?.evidence).toBe("MODERATE EVIDENCE");
  },
);

it.each([0, 1, 2, 3])(
  "only marks estimates early for one or two context days: %s",
  (count) => {
    expect(
      cardModel(
        {},
        { contextDays: baseAnalysis.trends.contextDays.slice(0, count) },
      ).status.estimateNote,
    ).toBe(
      count === 1 || count === 2 ? "Early estimate from limited history" : null,
    );
  },
);

it("formats estimates to one decimal and loads to at most two without rounding their source data", () => {
  const target = benchmark({ weight: 101.256 });
  const model = cardModel({
    currentEstimatedMax: { status: "available", value: 123.456 },
    recommendation: {
      kind: "continue_approach",
      reasons: [],
      benchmark: target,
    },
  });
  expect(model.status.estimatedMax).toBe("123.5");
  expect(model.action.benchmark?.value).toBe("101.26 KG × 3");
  expect(target.weight).toBe(101.256);
});

it.each(["load_reps", "effort_adjusted"] as const)(
  "normalizes %s performance against its baseline while keeping E1RM and volume in kilograms",
  (basis) => {
    const week = {
      startsAt: new Date(2026, 0, 5).getTime(),
      endsAt: new Date(2026, 0, 11, 23, 59, 59, 999).getTime(),
      partial: false,
      raw: 220,
      adjusted: 240,
      volume: 2000,
      exposures: 2,
    };
    const input = overviewWith(
      {},
      {
        basis,
        performance: { ...baseAnalysis.trends.performance, baseline: 200 },
        weekly: [
          week,
          {
            ...week,
            startsAt: new Date(2026, 0, 12).getTime(),
            endsAt: new Date(2026, 0, 18, 23, 59, 59, 999).getTime(),
            raw: 230,
            adjusted: null,
          },
        ],
      },
    );
    const performance = createProgressViewModel(
      input,
      "bench",
      "performance",
    ).chart;
    expect(performance.points[0].value).toBeCloseTo(
      basis === "load_reps" ? 110 : 120,
    );
    expect(performance.points[0].description).toBe(
      basis === "load_reps"
        ? "Jan 5–Jan 11: 110 index"
        : "Jan 5–Jan 11: 120 index",
    );
    if (basis === "effort_adjusted")
      expect(performance.points[1].value).toBeNull();
    else expect(performance.points[1].value).toBeCloseTo(115);
    expect(
      createProgressViewModel(input, "bench", "e1rm").chart.points.map(
        (point) => point.value,
      ),
    ).toEqual([220, 230]);
    expect(
      createProgressViewModel(input, "bench", "volume").chart.points.map(
        (point) => point.value,
      ),
    ).toEqual([2000, 2000]);
  },
);

it.each([null, 0])(
  "does not fabricate normalized performance with baseline %s",
  (baseline) => {
    const input = overviewWith(
      {},
      { performance: { ...baseAnalysis.trends.performance, baseline } },
    );
    expect(
      createProgressViewModel(input, "bench", "performance").chart.points.every(
        (point) => point.value === null,
      ),
    ).toBe(true);
  },
);
