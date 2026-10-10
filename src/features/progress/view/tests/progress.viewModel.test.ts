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
import { createProgressViewModel, formatChange } from "../progress.viewModel";
import {
  baseAnalysis,
  benchmark,
  cardModel,
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
])("formats %s and accessible selector statuses", (status) => {
  const model = cardModel({
    status: { ...baseAnalysis.status, value: status },
  });
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
])("formats %s as a qualified pattern", (kind) => {
  const model = cardModel({ diagnosis: { ...baseAnalysis.diagnosis, kind } });
  expect(model.why.diagnosis === null).toBe(kind === "none");
  if (kind === "fatigue")
    expect(model.why.diagnosis?.title).toBe("HIGHER TRAINING STRESS");
});

it("keeps four explanatory rows with unavailable reasons for empty history", () => {
  const model = createProgressViewModel(
    analyzeCompetitionLifts([], atDay(60)),
    "bench",
  );
  expect(model.why.rows.map((row) => row.id)).toEqual([
    "strength",
    "effort",
    "hard_sets",
    "frequency",
  ]);
  expect(
    model.why.rows.every(
      (row) => row.value === "—" && row.note,
    ),
  ).toBe(true);
  expect(model.action.benchmark).toBeNull();
  expect(model.status).toMatchObject({
    performance: null,
    estimatedMax: null,
    estimateChange: null,
  });
});

it("hides benchmarks and explains why when the retained snapshot is outdated", () => {
  expect(
    createProgressViewModel(overview, "bench").action.benchmark,
  ).not.toBeNull();
  const model = createProgressViewModel(overview, "bench", true);
  expect(model.action.benchmark).toBeNull();
  expect(model.action.unavailable).toContain("outdated");
});

it("keeps effort and hard work exact with factual notes", () => {
  const rows = cardModel(
    {},
    {
      effort: {
        ...baseAnalysis.trends.effort,
        change: { status: "available", value: 1 },
      },
      hardSetsChange: { status: "available", value: 80 },
      baselineWeeklyHardSets: 5,
      recentWeeklyHardSets: 9,
      baselineWorkloadRpeCoverage: 0.9,
      recentWorkloadRpeCoverage: 0.8,
      baselineWeeklyFrequency: 2,
      recentWeeklyFrequency: 1.3,
      maxGapDays: 10,
      missingCompleteWeeks: 1,
    },
  ).why.rows;
  expect(rows[1]).toMatchObject({ value: "+1 RPE" });
  expect(rows[2]).toMatchObject({
    value: "+80%",
  });
  expect(rows[1].note).toBe(
    "The same weight and reps felt harder, based on your logged RPE.",
  );
  expect(rows[2].note).toBe(
    "You averaged 9 hard sets per week, compared with 5 before (RPE 8+). You logged RPE for 80% of sets, compared with 90% before.",
  );
  expect(rows[3].note).toBe(
    "You logged this lift on an average of 1.3 days per week, compared with 2 before. Longest gap between logged training days: 10 days. 1 full week without a logged session.",
  );
  expect(rows.every((row) => !row.note?.includes("→"))).toBe(true);
});

it("shows an early estimated max without inventing a strength baseline", () => {
  const input = analyzeCompetitionLifts([exposure(60)], atDay(60));
  const strength = createProgressViewModel(input, "bench");
  expect(strength.status.estimatedMax).toBe("120");
  expect(strength.status.performance).toBeNull();
  expect(strength.status.estimateChange).toBeNull();
  expect(strength.status.estimateNote).toBe("Based on limited history");
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
  "explains Learning reason %s",
  (reason, expected) => {
    const key = Object.keys(learningReasons).find(
      (key): key is StatusReason => key === reason,
    );
    if (!key) throw new Error("Missing learning fixture");
    expect(
      cardModel({
        status: { value: "learning", reason: key, confirmed: false },
      }).status.summary,
    ).toBe(expected);
  },
);

const unavailableReasons = {
  no_history: "No recent workouts logged for this lift",
  no_performance: "No sets available for a reliable strength comparison",
  insufficient_history:
    "Log more similar sets across several weeks to compare results",
  missing_rpe: "No effort ratings (RPE) logged for these sets",
  partial_rpe:
    "More consistent RPE logging is needed for a reliable comparison",
  invalid_baseline: "There is no usable earlier value to compare with",
  incomplete_period: "More full weeks of training history are needed",
} satisfies Record<UnavailableReason, string>;

it.each(Object.entries(unavailableReasons))(
  "preserves unavailable reason %s instead of zero",
  (reason, expected) => {
    const key = Object.keys(unavailableReasons).find(
      (key): key is UnavailableReason => key === reason,
    );
    if (!key) throw new Error("Missing unavailable fixture");
    const row = cardModel(
      {},
      {
        effort: {
          ...baseAnalysis.trends.effort,
          change: { status: "unavailable", reason: key },
        },
      },
    ).why.rows[1];
    expect(row).toMatchObject({
      value: "—",
      note: expected,
    });
  },
);

it.each([
  { value: -0.001, expected: "0%" },
  { value: 0.049, expected: "0%" },
  { value: -0.049, expected: "0%" },
  { value: 0.05, expected: "+0.1%" },
  { value: -0.05, expected: "-0.1%" },
  { value: 2.56, expected: "+2.6%" },
])("formats $value as $expected", ({ value, expected }) =>
  expect(formatChange(value)).toBe(expected),
);

it.each(["weak", "moderate", "strong"] as const)(
  "keeps %s status evidence separate from diagnosis evidence",
  (level) => {
    const model = cardModel({
      evidence: { ...baseAnalysis.evidence, level },
      diagnosis: {
        kind: "fatigue",
        evidence: "moderate",
        reasons: [],
        referenceWindow: null,
      },
    });
    expect(model.status.evidence).toBe(`${level.toUpperCase()} EVIDENCE`);
    expect(model.why.diagnosis?.evidence).toBe("MODERATE EVIDENCE");
  },
);

it.each([0, 1, 2, 3])(
  "only marks one or two context days as an early estimate: %s",
  (count) => {
    expect(
      cardModel(
        {},
        { contextDays: baseAnalysis.trends.contextDays.slice(0, count) },
      ).status.estimateNote,
    ).toBe(count === 1 || count === 2 ? "Based on limited history" : null);
  },
);

it("compares the estimated max with the baseline from its own formula", () => {
  const input = analyzeCompetitionLifts(
    series(Array(16).fill(100)),
    atDay(60),
  );
  const model = createProgressViewModel(input, "bench");

  expect(input.lifts.bench.currentEstimatedMaxBasis).toBe("effort_adjusted");
  expect(model.status.estimatedMax).toBe("120");
  expect(model.status.estimateChange).toBe("No change vs baseline");

  const rawInput = analyzeCompetitionLifts(
    series(Array(16).fill(100), Array(16).fill(null)),
    atDay(60),
  );
  const rawModel = createProgressViewModel(rawInput, "bench");

  expect(rawInput.lifts.bench.currentEstimatedMaxBasis).toBe("load_reps");
  expect(rawModel.status.estimatedMax).toBe("112.5");
  expect(rawModel.status.estimateChange).toBe("No change vs baseline");
});

it("formats estimates and target loads without rounding source data", () => {
  const target = benchmark({
    weight: 101.256,
    referenceWeight: 100,
    loadChange: 1.256,
  });
  const model = cardModel({
    currentEstimatedMax: { status: "available", value: 123.456 },
    recommendation: {
      kind: "continue_approach",
      reasons: [],
      benchmarkUnavailableReason: null,
      benchmark: target,
    },
  });
  expect(model.status.estimatedMax).toBe("123.5");
  expect(model.action.benchmark?.value).toBe("101.26 KG × 3");
  expect(target.weight).toBe(101.256);
});

it("never replaces missing hard-set data with tonnage", () => {
  const input = analyzeCompetitionLifts(
    series(Array(16).fill(100), Array(16).fill(null)),
    atDay(60),
  );
  expect(input.lifts.bench.trends.recentWeeklyVolume).toBeGreaterThan(0);
  expect(input.lifts.bench.trends.recentWeeklyHardSets).toBeNull();
  expect(input.lifts.bench.trends.hardSetsChange).toMatchObject({
    status: "unavailable",
    reason: "partial_rpe",
  });
  expect(createProgressViewModel(input, "bench").why.rows[2]).toMatchObject({
    value: "—",
    note: "More consistent RPE logging is needed for a reliable comparison",
  });
});

it("explains withheld targets and matched-effort fallback", () => {
  const model = cardModel(
    {
      recommendation: {
        ...baseAnalysis.recommendation,
        benchmark: null,
        benchmarkUnavailableReason: "rounding_limits",
      },
    },
    { effort: { ...baseAnalysis.trends.effort, basis: "typical" } },
  );
  expect(model.action.unavailable).toContain("available plate increments");
  expect(model.why.rows[1].note).toBe(
    "This compares your usual logged RPE. There aren't enough sets at the same weight and reps for a direct comparison.",
  );
});
