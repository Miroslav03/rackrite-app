import {
  available,
  unavailable,
} from "../../measurements/progress.measurements";
import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { atDay, exposure } from "../../tests/progress.test.helpers";
import { deriveDailyRepObservations } from "../progress.dailyRepObservations";
import { deriveOverallRepTrends } from "../progress.overallRepTrends";
import type { RepLaneAgreement } from "../progress.overallRepTrends.types";
import { deriveWorkoutRepObservations } from "../progress.repObservations";
import { deriveRepLaneTrends } from "../progress.repLaneTrends";
import type {
  RepLanePeriod,
  RepLaneTrend,
  RepLaneWindowMode,
} from "../progress.repLaneTrends.types";
import { createRepLaneWindow } from "../progress.repLaneWindow";

function period(adjusted = true): RepLanePeriod {
  return {
    observationCount: 2,
    adjustedObservationCount: adjusted ? 2 : 0,
    workoutCount: 2,
    adjustedWorkoutCount: adjusted ? 2 : 0,
    rpeCoverage: adjusted ? 1 : 0,
    median: 100,
  };
}

function lane(
  reps: number,
  change: number,
  overrides: Partial<RepLaneTrend> = {},
): RepLaneTrend {
  const adjusted = overrides.basis !== "raw_load";
  return {
    family: "bench",
    reps,
    basis: "rpe_adjusted",
    earlier: period(adjusted),
    recent: { ...period(adjusted), median: 100 * (1 + change / 100) },
    change: available(change),
    ...overrides,
  };
}

function lanes(changes: readonly number[]): RepLaneTrend[] {
  return changes.map((change, index) => lane(index + 1, change));
}

it("returns no results when no lift families are supplied", () => {
  expect(deriveOverallRepTrends([])).toEqual([]);
});

it.each<{
  changes: number[];
  median: number;
  agreement: RepLaneAgreement;
}>([
  { changes: [3, 4, 5], median: 4, agreement: "consistent" },
  { changes: [2, 5, 8], median: 5, agreement: "consistent" },
  { changes: [3, 5], median: 4, agreement: "consistent" },
  { changes: [3, 4, 5, 6], median: 4.5, agreement: "consistent" },
  { changes: [5], median: 5, agreement: "single_lane" },
  { changes: [0, 0, 0], median: 0, agreement: "consistent" },
  { changes: [0.5, -0.5, 1], median: 0.5, agreement: "consistent" },
  { changes: [-3, -4, -5], median: -4, agreement: "consistent" },
  { changes: [4, 3, -2], median: 3, agreement: "minor_disagreement" },
  { changes: [-4, -3, 2], median: -3, agreement: "minor_disagreement" },
  { changes: [4, 3, -4], median: 3, agreement: "meaningful_disagreement" },
  { changes: [-4, -3, 4], median: -3, agreement: "meaningful_disagreement" },
  { changes: [5, 4, -8], median: 4, agreement: "major_conflict" },
  { changes: [4, -4], median: 0, agreement: "major_conflict" },
  { changes: [4, 4, -4, -4], median: 0, agreement: "major_conflict" },
  { changes: [2, 30], median: 16, agreement: "uneven" },
  { changes: [2, 3, 30], median: 3, agreement: "uneven" },
  { changes: [2, 12], median: 7, agreement: "consistent" },
  { changes: [2, 13], median: 7.5, agreement: "uneven" },
  { changes: [-2, -3, -20], median: -3, agreement: "uneven" },
])("aggregates $changes as $median with $agreement agreement", (scenario) => {
  const [result] = deriveOverallRepTrends(lanes(scenario.changes));
  expect(result.change).toEqual(available(scenario.median));
  expect(result.agreement).toBe(scenario.agreement);
  expect(result.contributingReps).toEqual(
    scenario.changes.map((_, index) => index + 1),
  );
});

it.each<{
  changes: number[];
  agreement: RepLaneAgreement;
}>([
  { changes: [20, 18, -8], agreement: "major_conflict" },
  { changes: [20, 18, -4], agreement: "meaningful_disagreement" },
  { changes: [20, 18, -2], agreement: "uneven" },
  { changes: [-20, -18, 8], agreement: "major_conflict" },
  { changes: [-20, -18, 4], agreement: "meaningful_disagreement" },
  { changes: [-20, -18, 2], agreement: "uneven" },
])("applies precedence for $changes: $agreement", ({ changes, agreement }) => {
  expect(deriveOverallRepTrends(lanes(changes))[0].agreement).toBe(agreement);
});

it.each([
  [2, -3],
  [2, 8, -3, -4],
  [4, -4, 0, 0],
  [4, 4, -4, -4, 1],
])(
  "detects balanced meaningful directions despite their median: %j",
  (...changes) => {
    expect(deriveOverallRepTrends(lanes(changes))[0].agreement).toBe(
      "major_conflict",
    );
  },
);

it.each([
  [4, 0.5, -0.5],
  [-4, 0.5, -0.5],
  [1.5, -2],
])("keeps neutral fluctuations consistent: %j", (...changes) => {
  expect(deriveOverallRepTrends(lanes(changes))[0].agreement).toBe(
    "consistent",
  );
});

it.each<{
  bases: ("rpe_adjusted" | "raw_load")[];
  expectedBasis: "rpe_adjusted" | "raw_load" | "mixed";
  evidenceCap: "strong" | "moderate";
}>([
  {
    bases: ["rpe_adjusted", "rpe_adjusted"],
    expectedBasis: "rpe_adjusted",
    evidenceCap: "strong",
  },
  {
    bases: ["raw_load", "raw_load"],
    expectedBasis: "raw_load",
    evidenceCap: "moderate",
  },
  {
    bases: ["rpe_adjusted", "raw_load"],
    expectedBasis: "mixed",
    evidenceCap: "moderate",
  },
  {
    bases: ["raw_load"],
    expectedBasis: "raw_load",
    evidenceCap: "moderate",
  },
  {
    bases: ["rpe_adjusted"],
    expectedBasis: "rpe_adjusted",
    evidenceCap: "strong",
  },
])("summarizes $bases with a $evidenceCap ceiling", (scenario) => {
  const [result] = deriveOverallRepTrends(
    scenario.bases.map((basis, index) => lane(index + 1, 4, { basis })),
  );
  expect(result).toMatchObject({
    change: available(4),
    agreement: scenario.bases.length === 1 ? "single_lane" : "consistent",
    measurementBasis: scenario.expectedBasis,
    evidenceCap: scenario.evidenceCap,
  });
});

it.each<{
  changes: number[];
  evidenceCap: "strong" | "moderate";
}>([
  { changes: [4, 3, -2], evidenceCap: "strong" },
  { changes: [-4, -3, 2], evidenceCap: "strong" },
  { changes: [4, 3, -4], evidenceCap: "moderate" },
  { changes: [5, 4, -8], evidenceCap: "moderate" },
  { changes: [4, -4], evidenceCap: "moderate" },
  { changes: [2, 30], evidenceCap: "moderate" },
])(
  "caps adjusted $changes at $evidenceCap without altering changes",
  (scenario) => {
    const [result] = deriveOverallRepTrends(lanes(scenario.changes));
    expect(result.measurementBasis).toBe("rpe_adjusted");
    expect(result.evidenceCap).toBe(scenario.evidenceCap);
    const [rawResult] = deriveOverallRepTrends(
      lanes(scenario.changes).map((trend) => ({ ...trend, basis: "raw_load" })),
    );
    expect(rawResult.evidenceCap).toBe("moderate");
    expect(rawResult.change).toEqual(result.change);
    expect(rawResult.agreement).toBe(result.agreement);
  },
);

it("excludes insufficient lanes without treating them as zero or changing basis", () => {
  const [result] = deriveOverallRepTrends([
    lane(2, 6),
    lane(5, 0, {
      basis: "insufficient",
      change: unavailable("insufficient_history"),
    }),
    lane(8, 0, { basis: "raw_load", change: unavailable("invalid_baseline") }),
  ]);
  expect(result).toEqual({
    family: "bench",
    change: available(6),
    contributingReps: [2],
    agreement: "single_lane",
    measurementBasis: "rpe_adjusted",
    evidenceCap: "strong",
  });
});

it("retains only qualifying exact reps in the median and traceability", () => {
  const [result] = deriveOverallRepTrends([
    lane(8, 5),
    lane(5, 0, { change: unavailable("insufficient_history") }),
    lane(2, 3),
  ]);
  expect(result.change).toEqual(available(4));
  expect(result.contributingReps).toEqual([2, 8]);
});

it("preserves represented families when every supplied lane is unavailable", () => {
  const input = [
    lane(2, 0, {
      family: "squat",
      basis: "insufficient",
      change: unavailable("insufficient_history"),
    }),
    lane(5, 0, { change: unavailable("invalid_baseline") }),
    lane(8, 0, {
      basis: "raw_load",
      change: unavailable("insufficient_history"),
    }),
  ];
  expect(deriveOverallRepTrends(input)).toEqual(
    ["bench", "squat"].map((family) => ({
      family,
      change: unavailable("insufficient_history"),
      contributingReps: [],
      agreement: "insufficient",
      measurementBasis: "insufficient",
      evidenceCap: null,
    })),
  );
});

it.each([NaN, Infinity, -Infinity])(
  "excludes non-finite available values (%s)",
  (value) => {
    const invalid = lane(5, 0, { change: { status: "available", value } });
    const [result] = deriveOverallRepTrends([lane(2, 3), invalid, lane(8, 5)]);
    expect(result.change).toEqual(available(4));
    expect(result.contributingReps).toEqual([2, 8]);
    expect(deriveOverallRepTrends([invalid])[0]).toMatchObject({
      change: unavailable("insufficient_history"),
      evidenceCap: null,
    });
  },
);

it("excludes an insufficient basis even if it carries an available measurement", () => {
  const [result] = deriveOverallRepTrends([
    lane(2, 3),
    lane(5, 100, { basis: "insufficient" }),
  ]);
  expect(result.change).toEqual(available(3));
  expect(result.contributingReps).toEqual([2]);
});

it("gives lanes equal influence despite substantially different sample counts", () => {
  const small = lane(2, 3);
  const largePeriod = {
    ...period(),
    observationCount: 20,
    adjustedObservationCount: 20,
    workoutCount: 100,
    adjustedWorkoutCount: 100,
  };
  const large = lane(8, 5, {
    earlier: { ...largePeriod },
    recent: { ...largePeriod },
  });
  const [result] = deriveOverallRepTrends([small, large]);
  expect(result.change).toEqual(available(4));
  expect(result.contributingReps).toEqual([2, 8]);
});

it("uses Step 3's selected results rather than recalculating period medians or eligibility", () => {
  const [result] = deriveOverallRepTrends([lane(2, 3), lane(8, 5)], {
    ...progressConfig,
    repLaneMinimumHalfDays: 10,
    rpeCoverage: 1,
  });
  expect(result.change).toEqual(available(4));
  expect(result.measurementBasis).toBe("rpe_adjusted");
});

it("aggregates lifts independently and sorts families and contributing reps", () => {
  const input = [
    lane(8, -6, { family: "squat" }),
    lane(5, 2, { family: "deadlift", basis: "raw_load" }),
    lane(8, 5),
    lane(2, -4, { family: "squat" }),
    lane(2, 3),
    lane(2, 0, {
      family: "deadlift",
      change: unavailable("insufficient_history"),
    }),
  ];
  expect(deriveOverallRepTrends(input)).toEqual([
    {
      family: "bench",
      change: available(4),
      contributingReps: [2, 8],
      agreement: "consistent",
      measurementBasis: "rpe_adjusted",
      evidenceCap: "strong",
    },
    {
      family: "deadlift",
      change: available(2),
      contributingReps: [5],
      agreement: "single_lane",
      measurementBasis: "raw_load",
      evidenceCap: "moderate",
    },
    {
      family: "squat",
      change: available(-5),
      contributingReps: [2, 8],
      agreement: "consistent",
      measurementBasis: "rpe_adjusted",
      evidenceCap: "strong",
    },
  ]);
  expect(deriveOverallRepTrends([...input].reverse())).toEqual(
    deriveOverallRepTrends(input),
  );
});

it.each<RepLaneWindowMode>(["early", "established"])(
  "handles shared workout days and partial RPE through the real Step 1–3 output in %s mode",
  (mode) => {
    const earlierStartsOn = mode === "early" ? 14 : 0;
    const recentStartsOn = mode === "early" ? 28 : 21;
    const history = [
      earlierStartsOn,
      earlierStartsOn + 7,
      recentStartsOn,
      recentStartsOn + 7,
    ].flatMap((day) => {
      const recent = day >= recentStartsOn;
      return [
        exposure(day, {
          id: `morning_${day}`,
          sets: [
            { reps: 2, weight: recent ? 102 : 100, rpe: 8 },
            { reps: 5, weight: recent ? 104 : 80, rpe: 8 },
          ],
        }),
        exposure(day, {
          id: `evening_${day}`,
          sets: [{ reps: 5, weight: recent ? 104 : 80, rpe: null }],
        }),
      ];
    });
    const sessions = deriveLiftSessions(history, "bench", atDay(42));
    const days = deriveDailyRepObservations(
      sessions.map((session) => ({
        workoutId: session.workoutId,
        family: session.family,
        finishedAt: session.finishedAt,
        observations: deriveWorkoutRepObservations(session.strengthSets),
      })),
    );
    const trends = deriveRepLaneTrends(
      days,
      createRepLaneWindow(atDay(42), mode),
    );
    expect(trends.map((trend) => trend.basis)).toEqual([
      "rpe_adjusted",
      "raw_load",
    ]);
    expect(trends[1].earlier.rpeCoverage).toBe(0.5);
    expect(trends[1].recent.rpeCoverage).toBe(0.5);
    expect(deriveOverallRepTrends(trends)).toEqual([
      {
        family: "bench",
        change: { status: "available", value: expect.closeTo(16, 10) },
        contributingReps: [2, 5],
        agreement: "uneven",
        measurementBasis: "mixed",
        evidenceCap: "moderate",
      },
    ]);
  },
);

const EPSILON = progressConfig.comparisonEpsilon;
it.each<{
  changes: number[];
  agreement: RepLaneAgreement;
}>([
  { changes: [2 - EPSILON / 2, -3 + EPSILON / 2], agreement: "major_conflict" },
  { changes: [2 - EPSILON * 2, -3], agreement: "minor_disagreement" },
  { changes: [2, -3 + EPSILON * 2], agreement: "minor_disagreement" },
  { changes: [4, 4, -1 - EPSILON / 2], agreement: "consistent" },
  { changes: [4, 4, -1 - EPSILON * 2], agreement: "minor_disagreement" },
  { changes: [-4, -4, 1 + EPSILON / 2], agreement: "consistent" },
  { changes: [-4, -4, 1 + EPSILON * 2], agreement: "minor_disagreement" },
  { changes: [4, 4, -3 + EPSILON / 2], agreement: "meaningful_disagreement" },
  { changes: [4, 4, -3 + EPSILON * 2], agreement: "minor_disagreement" },
  { changes: [-4, -4, 3 - EPSILON / 2], agreement: "meaningful_disagreement" },
  { changes: [-4, -4, 3 - EPSILON * 2], agreement: "minor_disagreement" },
  { changes: [6, 6, -5 + EPSILON / 2], agreement: "major_conflict" },
  { changes: [6, 6, -5 + EPSILON * 2], agreement: "meaningful_disagreement" },
  { changes: [-6, -6, 5 - EPSILON / 2], agreement: "major_conflict" },
  { changes: [-6, -6, 5 - EPSILON * 2], agreement: "meaningful_disagreement" },
  { changes: [2, 12 + EPSILON / 2], agreement: "consistent" },
  { changes: [2, 12 + EPSILON * 2], agreement: "uneven" },
])(
  "uses epsilon at boundaries: $changes → $agreement",
  ({ changes, agreement }) => {
    expect(deriveOverallRepTrends(lanes(changes))[0].agreement).toBe(agreement);
  },
);

it("uses dedicated configurable opposition and spread thresholds", () => {
  const config = {
    ...progressConfig,
    repLaneMinorOppositionPercent: 4,
    repLaneMajorOppositionPercent: 6,
    repLaneUnevenSpreadPercent: 20,
  };
  expect(deriveOverallRepTrends(lanes([4, 4, -3]), config)[0].agreement).toBe(
    "minor_disagreement",
  );
  expect(deriveOverallRepTrends(lanes([4, 4, -5]), config)[0].agreement).toBe(
    "meaningful_disagreement",
  );
  expect(deriveOverallRepTrends(lanes([2, 13]), config)[0].agreement).toBe(
    "consistent",
  );
});

it("reuses configurable meaningful-direction and neutral bands", () => {
  const config = {
    ...progressConfig,
    progressPercent: 3,
    regressionPercent: -4,
  };
  expect(deriveOverallRepTrends(lanes([2, -3]), config)[0].agreement).toBe(
    "consistent",
  );
  expect(deriveOverallRepTrends(lanes([3, -4]), config)[0].agreement).toBe(
    "major_conflict",
  );
  expect(
    deriveOverallRepTrends(lanes([4, 4, -2]), {
      ...config,
      neutralPercent: 2,
    })[0].agreement,
  ).toBe("consistent");
});

it("preserves unrounded changes and keeps extreme finite medians finite", () => {
  const changes = [3.1234567890123, 4.9876543210987];
  expect(deriveOverallRepTrends(lanes(changes))[0].change).toEqual(
    available(changes[0] / 2 + changes[1] / 2),
  );
  expect(
    deriveOverallRepTrends(lanes([Number.MAX_VALUE, Number.MAX_VALUE]))[0]
      .change,
  ).toEqual(available(Number.MAX_VALUE));
});

it("preserves frozen inputs, nested measurements, periods and configuration", () => {
  const input = [
    lane(8, 5),
    lane(2, 3),
    lane(5, 0, { change: unavailable("insufficient_history") }),
  ];
  const before = JSON.stringify(input);
  for (const trend of input) {
    Object.freeze(trend.earlier);
    Object.freeze(trend.recent);
    Object.freeze(trend.change);
    Object.freeze(trend);
  }
  Object.freeze(input);
  const config = Object.freeze({ ...progressConfig });
  expect(deriveOverallRepTrends(input, config)[0].contributingReps).toEqual([
    2, 8,
  ]);
  expect(JSON.stringify(input)).toBe(before);
});
