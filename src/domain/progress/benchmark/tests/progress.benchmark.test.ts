import type { LiftAnalysisCore } from "../../analysis/progress.analysis.types";
import { analyzeCompetitionLifts } from "../../analysis/progress.useCases";
import { atDay, series } from "../../tests/progress.test.helpers";
import { generateBenchmarkTarget } from "../progress.benchmark";
import { roundLoadDown } from "../progress.benchmark.utils";

function analysis(
  weight = 100,
  rpe: number | null = 7,
  reps = 3,
): LiftAnalysisCore {
  return analyzeCompetitionLifts(
    series(Array(13).fill(weight), Array(13).fill(rpe), reps),
    atDay(48),
  ).lifts.bench;
}

function progressing(weight = 100, rpe: number | null = 7) {
  const base = analysis(weight, rpe);

  return {
    ...base,
    status: {
      value: "progressing" as const,
      reason: "confirmed_trend" as const,
      confirmed: true,
    },
    diagnosis: { ...base.diagnosis, kind: "none" as const },
  };
}

it("supports a corroborated 100 kg × 3 at RPE 7 with one conservative increment", () => {
  expect(generateBenchmarkTarget(progressing(), "continue_approach")).toMatchObject({
    intent: "progress",
    weight: 102.5,
    reps: 3,
    rpe: { min: 7, max: 8 },
  });
});

it("repeats RPE 8 and preserves off-grid historical loads", () => {
  expect(
    generateBenchmarkTarget(progressing(101.3, 8), "continue_approach"),
  ).toMatchObject({ intent: "repeat", weight: 101.3, rpe: { min: 7, max: 8 } });
});

it("does not invent effort headroom or effort targets without RPE", () => {
  expect(
    generateBenchmarkTarget(progressing(100, null), "continue_approach"),
  ).toMatchObject({ intent: "repeat", weight: 100, rpe: null });
});

it.each([9, 10])(
  "reduces hard RPE %s references within the allowed band",
  (rpe) => {
    const target = generateBenchmarkTarget(analysis(100, rpe), "monitor");

    expect(target?.intent).toBe("reduce_stress");
    expect(target?.weight).toBeGreaterThanOrEqual(90);
    expect(target?.weight).toBeLessThanOrEqual(95);
    expect(target?.rpe?.max).toBeLessThanOrEqual(8);
  },
);

it("repeats stalling work and reduces confirmed regression", () => {
  const base = analysis();

  expect(
    generateBenchmarkTarget(
      { ...base, status: { ...base.status, value: "stalling" } },
      "monitor",
    )?.intent,
  ).toBe("repeat");
  expect(
    generateBenchmarkTarget(
      { ...base, status: { ...base.status, value: "regressing" } },
      "reassess",
    ),
  ).toMatchObject({ intent: "reduce_stress", weight: 95 });
});

it("withholds targets for Learning, weak evidence, stale references, and conflict", () => {
  const base = analysis();

  for (const changed of [
    { ...base, status: { ...base.status, value: "learning" as const } },
    { ...base, evidence: { ...base.evidence, level: "weak" as const } },
    { ...base, analysisTime: atDay(63) },
    { ...base, trends: { ...base.trends, conflictingSignals: true } },
  ])
    expect(generateBenchmarkTarget(changed, "monitor")).toBeNull();
});

it.each([1, 7, 10])(
  "does not invent a familiar target from %s-rep sets",
  (reps) => {
    expect(
      generateBenchmarkTarget(analysis(100, 8, reps), "continue_approach"),
    ).toBeNull();
  },
);

it("rejects an uncorroborated newest reference", () => {
  const base = analyzeCompetitionLifts(
    series([...Array(12).fill(100), 115], Array(13).fill(8), 3),
    atDay(48),
  ).lifts.bench;

  expect(generateBenchmarkTarget(base, "continue_approach")).toBeNull();
});

it("does not increase low loads beyond 2.5 percent", () => {
  expect(generateBenchmarkTarget(progressing(40), "continue_approach")).toMatchObject({
    intent: "repeat",
    weight: 40,
  });
});

it("omits a reduction when rounding would exceed ten percent", () => {
  expect(generateBenchmarkTarget(analysis(10, 9), "reduce_stress")).toBeNull();
});

it("rounds down without floating point step loss", () => {
  expect(roundLoadDown(102.5, 2.5)).toBe(102.5);
  expect(roundLoadDown(102.499, 2.5)).toBe(100);
  expect(roundLoadDown(0.3, 0.1)).toBe(0.3);
  expect(roundLoadDown(Infinity, 2.5)).toBeNull();
});

it("every generated heavier target respects both load caps", () => {
  for (const weight of [20, 40, 99.9, 100, 101.3, 200, 350]) {
    const target = generateBenchmarkTarget(progressing(weight), "continue_approach");

    if (target?.intent !== "progress") continue;

    expect(target.weight).toBeLessThanOrEqual(weight * 1.025 + 1e-8);
    expect(target.weight).toBeLessThanOrEqual(weight + 2.5 + 1e-8);
    expect(target.sources).toHaveLength(3);
    expect(target.weight % 2.5).toBe(0);
  }
});

it("withholds effort-based reductions when recent effort capacity is only partially recorded", () => {
  const history = series(
    Array(16).fill(100),
    [...Array(14).fill(null), 8, 8],
    3,
  );
  const base = analyzeCompetitionLifts(history, atDay(60)).lifts.bench;

  expect(generateBenchmarkTarget(base, "reduce_stress")).toBeNull();
});
