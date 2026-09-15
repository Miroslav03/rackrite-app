import { atDay, exposure, series } from "../../tests/progress.test.helpers";

import { analyzeCompetitionLifts } from "../progress.useCases";

it("reports Learning for a new lifter and short positive histories", () => {
  expect(
    analyzeCompetitionLifts([], atDay(1)).lifts.bench.status,
  ).toMatchObject({ value: "learning", reason: "no_history" });
  expect(
    analyzeCompetitionLifts(series([100, 102.5, 105]), atDay(8)).lifts.bench
      .status.value,
  ).toBe("learning");
});

it("recognizes repeated progression with or without RPE", () => {
  for (const rpes of [Array(16).fill(8), Array(16).fill(null)]) {
    const result = analyzeCompetitionLifts(
      series(
        Array.from({ length: 16 }, (_, i) => 80 + i * 2),
        rpes,
      ),
      atDay(60),
    ).lifts.bench;

    expect(result.status.value).toBe("progressing");
    expect(result.recommendation.kind).toBe("continue_approach");
  }
});

it("distinguishes prolonged flat performance from two flat sessions", () => {
  expect(
    analyzeCompetitionLifts(series([100, 100]), atDay(4)).lifts.bench.status
      .value,
  ).toBe("learning");
  expect(
    analyzeCompetitionLifts(series(Array(16).fill(100)), atDay(60)).lifts.bench
      .status.value,
  ).toBe("plateaued");
});

it("detects persistent effort changes at the same load", () => {
  const weights = Array(18).fill(100);
  const easier = analyzeCompetitionLifts(
    series(
      weights,
      weights.map((_, i) => (i < 6 ? 9 : i < 12 ? 8 : 7)),
    ),
    atDay(68),
  ).lifts.bench;
  const harder = analyzeCompetitionLifts(
    series(
      weights,
      weights.map((_, i) => (i < 6 ? 7 : i < 12 ? 8 : 9)),
    ),
    atDay(68),
  ).lifts.bench;

  expect(easier.status.value).toBe("progressing");
  expect(harder.status.value).toBe("regressing");
});

it("does not let one bad or strong workout establish a reversed status", () => {
  const improving = series(Array.from({ length: 16 }, (_, i) => 80 + i * 2));

  expect(
    analyzeCompetitionLifts(
      [...improving, exposure(64, { sets: [{ weight: 50 }] })],
      atDay(64),
    ).lifts.bench.status.value,
  ).not.toBe("regressing");

  const flat = series(Array(16).fill(100));

  expect(
    analyzeCompetitionLifts(
      [...flat, exposure(64, { sets: [{ weight: 200 }] })],
      atDay(64),
    ).lifts.bench.status.value,
  ).not.toBe("progressing");
});

it("resets after gaps and withholds stale targets", () => {
  const old = series(Array.from({ length: 16 }, (_, i) => 80 + i * 2));

  expect(
    analyzeCompetitionLifts(old, atDay(90)).lifts.bench.status.reason,
  ).toBe("stale_history");

  const result = analyzeCompetitionLifts([...old, exposure(100)], atDay(100))
    .lifts.bench;

  expect(result.status).toMatchObject({
    value: "learning",
    reason: "training_gap",
  });
  expect(result.recommendation.benchmark).toBeNull();
});

it("keeps missing performance distinct from zero change", () => {
  const result = analyzeCompetitionLifts(
    [exposure(0, { sets: [{ type: "warmup" }] })],
    atDay(1),
  ).lifts.bench;

  expect(result.status.reason).toBe("no_performance");
  expect(result.currentEstimatedMax.status).toBe("unavailable");
  expect(result.trends.performance.change.status).toBe("unavailable");
});

it("produces identical analysis for reordered input and does not mutate it", () => {
  const input = series(Array(16).fill(100)),
    snapshot = JSON.stringify(input);

  expect(analyzeCompetitionLifts([...input].reverse(), atDay(60))).toEqual(
    analyzeCompetitionLifts(input, atDay(60)),
  );
  expect(JSON.stringify(input)).toBe(snapshot);
});

it("withholds conclusions when load improves but adjusted effort performance regresses", () => {
  const history = series(
    Array.from({ length: 16 }, (_, i) => (i < 8 ? 100 : 102.5)),
    Array.from({ length: 16 }, (_, i) => (i < 8 ? 7 : 10)),
  );
  const result = analyzeCompetitionLifts(history, atDay(60)).lifts.bench;

  expect(result.status).toMatchObject({
    value: "learning",
    reason: "conflicting_signals",
  });
  expect(result.recommendation.benchmark).toBeNull();
});

it("identifies rising effort and competition workload as possible fatigue, not measured fatigue", () => {
  const history = Array.from({ length: 24 }, (_, i) =>
    exposure(i * 3, {
      sets: Array.from({ length: i < 14 ? 2 : 4 }, () => ({
        weight: 100,
        reps: 5,
        rpe: i < 14 ? 7 : 9,
      })),
    }),
  );
  const result = analyzeCompetitionLifts(history, atDay(69)).lifts.bench;

  expect(result.status.value).toBe("regressing");
  expect(result.diagnosis).toMatchObject({
    kind: "fatigue",
    evidence: "moderate",
  });
  expect(result.recommendation.kind).toBe("reduce_stress");
});

it("does not diagnose fatigue from rising volume during improving performance", () => {
  const history = Array.from({ length: 24 }, (_, i) =>
    exposure(i * 3, {
      sets: Array.from({ length: i < 14 ? 2 : 4 }, () => ({
        weight: 80 + i * 3,
        rpe: 8,
      })),
    }),
  );
  const result = analyzeCompetitionLifts(history, atDay(69)).lifts.bench;

  expect(result.status.value).toBe("progressing");
  expect(result.diagnosis.kind).toBe("none");
});

it("does not infer inadequate stimulus without a personal productive baseline or effort history", () => {
  for (const rpe of [null, 8]) {
    const result = analyzeCompetitionLifts(
      series(Array(24).fill(100), Array(24).fill(rpe)),
      atDay(92),
    ).lifts.bench;

    expect(result.status.value).toBe("plateaued");
    expect(result.diagnosis.kind).toBe("insufficient_evidence");
  }
});

it("caps status evidence when completed non-warmup records are invalid", () => {
  const history = Array.from({ length: 16 }, (_, i) =>
    exposure(i * 4, { sets: [{ weight: 100 }, { weight: -10 }] }),
  );
  const result = analyzeCompetitionLifts(history, atDay(60)).lifts.bench;

  expect(result.evidence).toMatchObject({
    level: "weak",
    reasons: ["invalid_records"],
  });
  expect(result.recommendation.benchmark).toBeNull();
});

it("finds a personal productive period before suggesting reduced stimulus", () => {
  const history = Array.from({ length: 56 }, (_, i) => {
    const day = i * 3;
    const productive = day >= 77 && day < 119;
    const weight = productive ? 90 + (day - 77) / 4 : 100;

    return exposure(day, {
      sets: Array.from({ length: productive ? 5 : 2 }, () => ({
        weight,
        rpe: 8,
      })),
    });
  });
  const result = analyzeCompetitionLifts(history, atDay(165)).lifts.bench;

  expect(result.status.value).toBe("plateaued");
  expect(result.diagnosis).toMatchObject({
    kind: "insufficient_stimulus",
    evidence: "moderate",
    reasons: ["lower_historical_workload"],
  });
  expect(result.diagnosis.referenceWindow).not.toBeNull();
  expect(result.recommendation.kind).toBe("review_stimulus");
});

it("requires renewed comparable confirmation after effort coverage changes", () => {
  const rawHistory = series(
    Array.from({ length: 10 }, (_, i) => 80 + i * 2),
    Array(10).fill(null),
  );
  const withEffort = [
    ...rawHistory,
    ...Array.from({ length: 12 }, (_, i) =>
      exposure(40 + i * 4, { sets: [{ weight: 100, rpe: 8 }] }),
    ),
  ];
  const result = analyzeCompetitionLifts(withEffort, atDay(84)).lifts.bench;

  expect(result.trends.basis).toBe("effort_adjusted");
  expect(analyzeCompetitionLifts([...withEffort].reverse(), atDay(84))).toEqual(
    analyzeCompetitionLifts(withEffort, atDay(84)),
  );
});

it.each([
  { recent: 102, expected: "progressing" },
  { recent: 101, expected: "stable" },
  { recent: 99, expected: "stable" },
  { recent: 98.5, expected: "stalling" },
  { recent: 97, expected: "regressing" },
])(
  "classifies repeated $recent kg references at the threshold boundary as $expected",
  ({ recent, expected }) => {
    const weights = [...Array(6).fill(100), ...Array(5).fill(recent)];
    const result = analyzeCompetitionLifts(series(weights), atDay(40)).lifts
      .bench;

    expect(result.status.value).toBe(expected);
  },
);
