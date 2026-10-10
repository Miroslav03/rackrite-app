import { analyzeCompetitionLifts } from "../../analysis/progress.useCases";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { deriveLiftTrends } from "../../trends/progress.trends";
import { groupLiftWeeks } from "../../trends/progress.trends.utils";
import { atDay, exposure, series } from "../../tests/progress.test.helpers";
import { rpeBand, weightedMedian } from "../progress.strength.utils";

it("measures repeated same-rep same-effort loads directly", () => {
  const history = series([...Array(8).fill(120), ...Array(8).fill(125)], [], 3);
  const result = analyzeCompetitionLifts(history, atDay(60)).lifts.bench;
  expect(result.trends.basis).toBe("matched_reps_rpe");
  expect(result.trends.performance.change).toEqual({
    status: "available",
    value: expect.closeTo(100 * (125 / 120 - 1), 8),
  });
  expect(result.status.value).toBe("progressing");
  expect(result.trends.strength.baseline).toBe(100);
  expect(result.trends.raw.baseline).not.toBe(100);
});

it("falls back to effort-adjusted strength when identical work becomes easier", () => {
  const history = series(
    Array(18).fill(120),
    [...Array(6).fill(9), ...Array(6).fill(8), ...Array(6).fill(7)],
    3,
  );
  const result = analyzeCompetitionLifts(history, atDay(68)).lifts.bench;
  expect(result.status.value).toBe("progressing");
  expect(result.trends.basis).toBe("effort_adjusted");
  expect(result.trends.effort).toMatchObject({
    basis: "matched",
    change: { status: "available", value: -1 },
  });
});

it("counts a split workout once per strength bucket and once for exposure frequency", () => {
  const history = series(Array(16).fill(120), [], 3);
  const extra = exposure(60, {
    id: "split",
    sets: Array.from({ length: 8 }, () => ({ weight: 120, reps: 3, rpe: 8 })),
  });
  const original = analyzeCompetitionLifts(history, atDay(60)).lifts.bench;
  const split = analyzeCompetitionLifts([...history, extra], atDay(60)).lifts
    .bench;
  expect(split.trends.strength.baselineDays).toBe(
    original.trends.strength.baselineDays,
  );
  expect(split.trends.strength.recentDays).toBe(
    original.trends.strength.recentDays,
  );
  expect(split.evidence).toEqual(original.evidence);
  const originalWeek = groupLiftWeeks(original.sessions, atDay(60), 1)[0];
  const splitWeek = groupLiftWeeks(split.sessions, atDay(60), 1)[0];
  expect(splitWeek.exposures).toBe(originalWeek.exposures);
  expect(splitWeek.hardSets).toBe((originalWeek.hardSets ?? 0) + 8);
});

it("uses repetition matching without filling missing effort", () => {
  const result = analyzeCompetitionLifts(
    series(Array(16).fill(100), Array(16).fill(null), 3),
    atDay(60),
  ).lifts.bench;
  expect(result.trends.basis).toBe("matched_reps");
  expect(result.trends.effort.change).toMatchObject({
    status: "unavailable",
    reason: "missing_rpe",
  });
  expect(groupLiftWeeks(result.sessions, atDay(60), 1)[0].hardSets).toBeNull();
  expect(result.trends.effort.sources).toEqual([]);
  expect(result.facts.some((fact) => fact.metric === "matched_effort")).toBe(
    false,
  );
  expect(result.recommendation.benchmark?.rpe).toBeNull();
});

it("does not promote a sparsely matched subset over the whole history", () => {
  const history = Array.from({ length: 16 }, (_, index) =>
    exposure(index * 3, {
      sets: [{ weight: 100, reps: index % 2 ? 3 : 5, rpe: 8 }],
    }),
  );
  const trends = deriveLiftTrends(
    deriveLiftSessions(history, "bench", atDay(45)),
    atDay(45),
  );
  expect(trends.strength.baselineCoverage).toBeGreaterThanOrEqual(0.8);
  const shifted = history.map((item, index) =>
    index < 8
      ? item
      : exposure(index * 3, { sets: [{ weight: 90, reps: 6, rpe: 8 }] }),
  );
  const result = analyzeCompetitionLifts(shifted, atDay(45)).lifts.bench;
  expect(result.trends.basis).toBe("effort_adjusted");
});

it("makes RPE bands non-overlapping and weighted medians deterministic", () => {
  expect([7, 8, 9, 10].map(rpeBand)).toEqual(["7-8", "7-8", "8-9", "9-10"]);
  expect(
    weightedMedian([
      { value: -1, weight: 3 },
      { value: 4, weight: 4 },
    ]),
  ).toBe(4);
  expect(
    weightedMedian([
      { value: 4, weight: 3 },
      { value: -1, weight: 3 },
    ]),
  ).toBe(1.5);
  expect(
    weightedMedian([
      { value: Number.MAX_VALUE, weight: 1 },
      { value: Number.MAX_VALUE, weight: 1 },
    ]),
  ).toBe(Number.MAX_VALUE);
});

it("requires the matched days themselves to span at least 21 days", () => {
  const history = [0, 16, 17, 18, 19, 22, 23, 24, 25, 40].map((day) =>
    exposure(day, {
      sets: [{ weight: 100, reps: day === 0 || day === 40 ? 8 : 3, rpe: 8 }],
    }),
  );
  const result = analyzeCompetitionLifts(history, atDay(40)).lifts.bench;
  expect(result.trends.basis).toBe("effort_adjusted");
  expect(result.trends.strength.buckets).toEqual([]);
});

it("distinguishes recorded zero hard sets from absent RPE and excludes uneven coverage from comparisons", () => {
  const easy = analyzeCompetitionLifts(
    series(Array(24).fill(100), Array(24).fill(7), 3, 3),
    atDay(69),
  ).lifts.bench;
  expect(groupLiftWeeks(easy.sessions, atDay(69), 1)[0].hardSets).toBe(0);
  const partial = Array.from({ length: 24 }, (_, index) =>
    exposure(index * 3, {
      sets: Array.from({ length: 4 }, (_, set) => ({
        weight: 100,
        reps: 3,
        rpe: index >= 14 && set === 0 ? null : 8,
      })),
    }),
  );
  expect(
    analyzeCompetitionLifts(partial, atDay(69)).lifts.bench.trends
      .hardSetsChange,
  ).toMatchObject({ status: "unavailable", reason: "partial_rpe" });
});

it("retains matched-effort provenance in day and cohort order within the comparison window", () => {
  const days = [0, 7, 14, 21, 28, 35, 42, 49, 56, 63];
  const history = days.map((day) =>
    exposure(day, {
      sets: [
        { weight: 100, reps: 3, rpe: day < 49 ? 8 : 7 },
        { weight: 90, reps: 5, rpe: day < 49 ? 8 : 7 },
      ],
    }),
  );
  const split = exposure(35, {
    id: "split",
    sets: [
      { weight: 90, reps: 5, rpe: 8 },
      { weight: 100, reps: 3, rpe: 8 },
    ],
  });
  const unmatched = exposure(60, {
    id: "unmatched",
    sets: [{ weight: 55, reps: 6, rpe: 8 }],
  });
  const result = analyzeCompetitionLifts(
    [...history, split, unmatched],
    atDay(63),
  ).lifts.bench;

  expect(result.trends.effort).toMatchObject({
    basis: "matched",
    change: { status: "available", value: -1 },
  });
  expect(
    result.trends.effort.sources
      .filter(
        (set) => set.workoutId === "workout_35" || set.workoutId === "split",
      )
      .map((set) => set.setId),
  ).toEqual([
    "set_split_1",
    "set_workout_35_0",
    "set_split_0",
    "set_workout_35_1",
  ]);
  expect(result.facts.find((fact) => fact.metric === "matched_effort")).toEqual(
    {
      metric: "matched_effort",
      change: { status: "available", value: -1 },
      window: result.trends.performance.window,
      workoutIds: [
        "workout_28",
        "split",
        "workout_35",
        "workout_42",
        "workout_49",
        "workout_56",
        "workout_63",
      ],
    },
  );
});
