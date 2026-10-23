import {
  localCalendarDay,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import type { LiftFamily } from "@/domain/domain.types";

import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { atDay, exposure } from "../../tests/progress.test.helpers";
import { selectComparisonHistory } from "../../trends/progress.trends.utils";
import { deriveDailyRepObservations } from "../progress.dailyRepObservations";
import type { DailyRepObservation } from "../progress.dailyRepObservations.types";
import { deriveWorkoutRepObservations } from "../progress.repObservations";
import { deriveRepLaneTrends } from "../progress.repLaneTrends";
import type {
  RepLaneWindow,
  RepLaneWindowMode,
} from "../progress.repLaneTrends.types";
import { createRepLaneWindow } from "../progress.repLaneWindow";

const WINDOW: RepLaneWindow = {
  earlierStartsAt: startOfLocalDay(atDay(0)),
  recentStartsAt: startOfLocalDay(atDay(21)),
  endExclusive: startOfLocalDay(atDay(42)),
};
const NO_RPE = { adjustedE1rm: null, adjustedWorkoutCount: 0 };

function dailyHistory(
  history: Parameters<typeof deriveLiftSessions>[0],
  family: LiftFamily = "bench",
) {
  const sessions = deriveLiftSessions(history, family, atDay(50));
  return deriveDailyRepObservations(
    sessions.map((session) => ({
      workoutId: session.workoutId,
      family: session.family,
      finishedAt: session.finishedAt,
      observations: deriveWorkoutRepObservations(session.strengthSets),
    })),
  );
}

function daily(
  day: number,
  overrides: Partial<DailyRepObservation> = {},
): DailyRepObservation {
  const [observation] = dailyHistory([exposure(day)]);
  return { ...observation, ...overrides };
}

function laneDays(
  earlier: readonly Partial<DailyRepObservation>[],
  recent: readonly Partial<DailyRepObservation>[],
) {
  return [
    ...earlier.map((values, index) => daily(index * 3, values)),
    ...recent.map((values, index) => daily(21 + index * 3, values)),
  ];
}

it("returns no lanes for empty input or history entirely outside the window", () => {
  expect(deriveRepLaneTrends([], WINDOW)).toEqual([]);
  expect(
    deriveRepLaneTrends([daily(-1), daily(42), daily(50)], WINDOW),
  ).toEqual([]);
});

it("compares three earlier and three recent daily adjusted observations", () => {
  const days = laneDays(
    [{ adjustedE1rm: 118 }, { adjustedE1rm: 120 }, { adjustedE1rm: 122 }],
    [{ adjustedE1rm: 124 }, { adjustedE1rm: 126 }, { adjustedE1rm: 128 }],
  );
  expect(deriveRepLaneTrends(days, WINDOW)).toEqual([
    {
      family: "bench",
      reps: 5,
      basis: "rpe_adjusted",
      earlier: {
        observationCount: 3,
        adjustedObservationCount: 3,
        workoutCount: 3,
        adjustedWorkoutCount: 3,
        rpeCoverage: 1,
        median: 120,
      },
      recent: {
        observationCount: 3,
        adjustedObservationCount: 3,
        workoutCount: 3,
        adjustedWorkoutCount: 3,
        rpeCoverage: 1,
        median: 126,
      },
      change: { status: "available", value: expect.closeTo(5, 10) },
    },
  ]);
});

it("qualifies exactly two days per half without changing the legacy three-day minimum", () => {
  expect(progressConfig.minimumHalfDays).toBe(3);
  expect(progressConfig.repLaneMinimumHalfDays).toBe(2);
  const [trend] = deriveRepLaneTrends(laneDays([{}, {}], [{}, {}]), WINDOW);
  expect(trend.basis).toBe("rpe_adjusted");
  expect(trend.change).toEqual({ status: "available", value: 0 });

  const [stricter] = deriveRepLaneTrends(laneDays([{}, {}], [{}, {}]), WINDOW, {
    ...progressConfig,
    repLaneMinimumHalfDays: 3,
  });
  expect(stricter.change).toEqual({
    status: "unavailable",
    reason: "insufficient_history",
  });
});

it.each([
  {
    earlier: [100, 102.5],
    recent: [105, 107.5],
    earlierMedian: 101.25,
    recentMedian: 106.25,
  },
  {
    earlier: [100, 105, 110],
    recent: [95, 100, 105],
    earlierMedian: 105,
    recentMedian: 100,
  },
  {
    earlier: [100, 100],
    recent: [100, 100],
    earlierMedian: 100,
    recentMedian: 100,
  },
])(
  "compares raw loads with correct medians and signed changes: %o",
  ({ earlier, recent, earlierMedian, recentMedian }) => {
    const [trend] = deriveRepLaneTrends(
      laneDays(
        earlier.map((rawKg) => ({ rawKg, ...NO_RPE })),
        recent.map((rawKg) => ({ rawKg, ...NO_RPE })),
      ),
      WINDOW,
    );
    expect(trend.basis).toBe("raw_load");
    expect(trend.earlier.median).toBe(earlierMedian);
    expect(trend.recent.median).toBe(recentMedian);
    expect(trend.change).toEqual({
      status: "available",
      value: (recentMedian / earlierMedian - 1) * 100,
    });
    expect(trend.earlier.rpeCoverage).toBe(0);
    expect(trend.recent.rpeCoverage).toBe(0);
  },
);

it("keeps rep lanes independent, including all supported reps from 1 through 10", () => {
  const days = Array.from({ length: 10 }, (_, index) => index + 1).flatMap(
    (reps) =>
      laneDays(
        [
          { reps, rawKg: 100, ...NO_RPE },
          { reps, rawKg: 100, ...NO_RPE },
        ],
        [
          { reps, rawKg: 100 + reps, ...NO_RPE },
          { reps, rawKg: 100 + reps, ...NO_RPE },
        ],
      ),
  );
  const trends = deriveRepLaneTrends(days.reverse(), WINDOW);
  expect(trends.map((trend) => trend.reps)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ]);
  for (const trend of trends) {
    expect(trend.change).toEqual({
      status: "available",
      value: expect.closeTo(trend.reps, 10),
    });
    expect(trend.earlier.observationCount).toBe(2);
    expect(trend.recent.observationCount).toBe(2);
  }
});

it("sorts by lift family then reps and never mixes families or their RPE coverage", () => {
  const families: readonly LiftFamily[] = ["squat", "deadlift", "bench"];
  const days = families.flatMap((family) => {
    return [2, 5].flatMap((reps) =>
      laneDays(
        [
          { family, reps, rawKg: 100, ...(family === "bench" ? NO_RPE : {}) },
          { family, reps, rawKg: 100, ...(family === "bench" ? NO_RPE : {}) },
        ],
        [
          { family, reps, rawKg: 110, ...(family === "bench" ? NO_RPE : {}) },
          { family, reps, rawKg: 110, ...(family === "bench" ? NO_RPE : {}) },
        ],
      ),
    );
  });
  const trends = deriveRepLaneTrends(days, WINDOW);
  expect(trends.map(({ family, reps }) => [family, reps])).toEqual([
    ["bench", 2],
    ["bench", 5],
    ["deadlift", 2],
    ["deadlift", 5],
    ["squat", 2],
    ["squat", 5],
  ]);
  expect(
    trends
      .filter((trend) => trend.family === "bench")
      .every((trend) => trend.basis === "raw_load"),
  ).toBe(true);
  expect(
    trends
      .filter((trend) => trend.family !== "bench")
      .every((trend) => trend.basis === "rpe_adjusted"),
  ).toBe(true);
});

it("uses adjusted performance at exactly 70% workout coverage in both periods", () => {
  const period = [
    { workoutCount: 6, adjustedWorkoutCount: 4 },
    { workoutCount: 4, adjustedWorkoutCount: 3 },
  ];
  const [trend] = deriveRepLaneTrends(laneDays(period, period), WINDOW);
  expect(trend.basis).toBe("rpe_adjusted");
  for (const summary of [trend.earlier, trend.recent]) {
    expect(summary).toMatchObject({
      observationCount: 2,
      adjustedObservationCount: 2,
      workoutCount: 10,
      adjustedWorkoutCount: 7,
      rpeCoverage: 0.7,
    });
  }
});

it.each(["earlier", "recent"])(
  "uses raw loads when %s coverage is immediately below 70%",
  (period) => {
    const below = [
      { workoutCount: 10_000_000_000, adjustedWorkoutCount: 6_999_999_999 },
      { workoutCount: 10_000_000_000, adjustedWorkoutCount: 6_999_999_999 },
    ];
    const full = [{}, {}];
    const [trend] = deriveRepLaneTrends(
      laneDays(
        period === "earlier" ? below : full,
        period === "recent" ? below : full,
      ),
      WINDOW,
    );
    expect(trend.basis).toBe("raw_load");
    expect(trend.earlier.median).toBe(100);
    expect(trend.recent.median).toBe(100);
    expect(trend[period === "earlier" ? "earlier" : "recent"].rpeCoverage).toBe(
      0.6999999999,
    );
  },
);

it("weights coverage by contributing workouts rather than averaging daily coverage", () => {
  const period = [
    { workoutCount: 1, adjustedWorkoutCount: 1 },
    { workoutCount: 9, adjustedWorkoutCount: 5 },
  ];
  const [trend] = deriveRepLaneTrends(laneDays(period, period), WINDOW);
  expect(trend.basis).toBe("raw_load");
  expect(trend.earlier.rpeCoverage).toBe(0.6);
  expect(trend.recent.rpeCoverage).toBe(0.6);
});

it.each(["earlier", "recent"])(
  "requires two valid adjusted days even when %s coverage is 90%",
  (period) => {
    const oneAdjustedDay = [
      { workoutCount: 9, adjustedWorkoutCount: 9 },
      { workoutCount: 1, ...NO_RPE },
    ];
    const full = [{}, {}];
    const [trend] = deriveRepLaneTrends(
      laneDays(
        period === "earlier" ? oneAdjustedDay : full,
        period === "recent" ? oneAdjustedDay : full,
      ),
      WINDOW,
    );
    expect(trend.basis).toBe("raw_load");
    expect(trend[period === "earlier" ? "earlier" : "recent"]).toMatchObject({
      rpeCoverage: 0.9,
      adjustedObservationCount: 1,
    });
  },
);

it("never mixes raw and adjusted measurement bases when coverage changes", () => {
  const [trend] = deriveRepLaneTrends(
    laneDays(
      [
        { rawKg: 100, adjustedE1rm: 120 },
        { rawKg: 105, adjustedE1rm: 126 },
      ],
      [
        { rawKg: 110, ...NO_RPE },
        { rawKg: 115, adjustedE1rm: 140 },
      ],
    ),
    WINDOW,
  );
  expect(trend.basis).toBe("raw_load");
  expect(trend.earlier).toMatchObject({
    median: 102.5,
    rpeCoverage: 1,
    adjustedObservationCount: 2,
  });
  expect(trend.recent).toMatchObject({
    median: 112.5,
    rpeCoverage: 0.5,
    adjustedObservationCount: 1,
  });
});

it("excludes missing adjusted values from an otherwise eligible adjusted median", () => {
  const period = [
    { adjustedE1rm: 120, workoutCount: 4, adjustedWorkoutCount: 4 },
    { adjustedE1rm: 126, workoutCount: 4, adjustedWorkoutCount: 4 },
    { ...NO_RPE },
  ];
  const [trend] = deriveRepLaneTrends(laneDays(period, period), WINDOW);
  expect(trend.basis).toBe("rpe_adjusted");
  expect(trend.earlier).toMatchObject({
    median: 123,
    observationCount: 3,
    adjustedObservationCount: 2,
    rpeCoverage: 8 / 9,
  });
});

it("uses daily medians without reweighting them by workout count", () => {
  const [trend] = deriveRepLaneTrends(
    laneDays(
      [
        { adjustedE1rm: 120, workoutCount: 9, adjustedWorkoutCount: 9 },
        { adjustedE1rm: 140 },
      ],
      [
        { adjustedE1rm: 120, workoutCount: 9, adjustedWorkoutCount: 9 },
        { adjustedE1rm: 140 },
      ],
    ),
    WINDOW,
  );
  expect(trend.earlier).toMatchObject({
    observationCount: 2,
    workoutCount: 10,
    median: 130,
  });
  expect(trend.recent.median).toBe(130);
});

it("preserves partial same-day RPE coverage from Steps 1 and 2", () => {
  const days = dailyHistory([
    exposure(0, { id: "morning", sets: [{ weight: 100, rpe: 8 }] }),
    exposure(0, { id: "evening", sets: [{ weight: 105, rpe: null }] }),
    exposure(7),
    exposure(21, { sets: [{ weight: 110 }] }),
    exposure(28, { sets: [{ weight: 115 }] }),
  ]);
  const [trend] = deriveRepLaneTrends(days, WINDOW);
  expect(trend.basis).toBe("raw_load");
  expect(trend.earlier).toMatchObject({
    observationCount: 2,
    adjustedObservationCount: 2,
    workoutCount: 3,
    adjustedWorkoutCount: 2,
    rpeCoverage: 2 / 3,
    median: 101.25,
  });
  expect(trend.recent).toMatchObject({
    observationCount: 2,
    workoutCount: 2,
    rpeCoverage: 1,
    median: 112.5,
  });
});

it("does not count multiple same-day workouts as multiple independent days", () => {
  const days = dailyHistory(
    [0, 21].flatMap((day) => [
      exposure(day, { id: `morning_${day}` }),
      exposure(day, { id: `evening_${day}` }),
    ]),
  );
  const [trend] = deriveRepLaneTrends(days, WINDOW);
  expect(trend.basis).toBe("insufficient");
  expect(trend.earlier).toMatchObject({
    observationCount: 1,
    workoutCount: 2,
    median: null,
  });
  expect(trend.recent).toMatchObject({
    observationCount: 1,
    workoutCount: 2,
    median: null,
  });
  expect(trend.change).toEqual({
    status: "unavailable",
    reason: "insufficient_history",
  });
});

it.each([
  [1, 2],
  [2, 1],
  [0, 3],
  [3, 0],
])(
  "reports insufficient history for %i earlier and %i recent days",
  (earlier, recent) => {
    const [trend] = deriveRepLaneTrends(
      laneDays(
        Array.from({ length: earlier }, () => ({})),
        Array.from({ length: recent }, () => ({})),
      ),
      WINDOW,
    );
    expect(trend.basis).toBe("insufficient");
    expect(trend.earlier.observationCount).toBe(earlier);
    expect(trend.recent.observationCount).toBe(recent);
    expect(trend.earlier.median).toBeNull();
    expect(trend.recent.median).toBeNull();
    expect(trend.change).toEqual({
      status: "unavailable",
      reason: "insufficient_history",
    });
  },
);

it("does not pool different reps across periods to invent a comparison", () => {
  const trends = deriveRepLaneTrends(
    laneDays([{ reps: 2 }, { reps: 2 }], [{ reps: 5 }, { reps: 5 }]),
    WINDOW,
  );
  expect(trends.map(({ reps, basis }) => ({ reps, basis }))).toEqual([
    { reps: 2, basis: "insufficient" },
    { reps: 5, basis: "insufficient" },
  ]);
  expect(trends.every((trend) => trend.change.status === "unavailable")).toBe(
    true,
  );
});

it("keeps coverage independent for different rep lanes", () => {
  const days = [2, 5].flatMap((reps) =>
    laneDays(
      [
        { reps, ...(reps === 5 ? NO_RPE : {}) },
        { reps, ...(reps === 5 ? NO_RPE : {}) },
      ],
      [
        { reps, ...(reps === 5 ? NO_RPE : {}) },
        { reps, ...(reps === 5 ? NO_RPE : {}) },
      ],
    ),
  );
  expect(
    deriveRepLaneTrends(days, WINDOW).map(({ reps, basis }) => ({
      reps,
      basis,
    })),
  ).toEqual([
    { reps: 2, basis: "rpe_adjusted" },
    { reps: 5, basis: "raw_load" },
  ]);
});

it("uses actual dates without filling skipped weeks or requiring fixed weekdays", () => {
  const days = [0, 17, 21, 39].map((day) =>
    daily(day, { rawKg: day < 21 ? 100 : 110, ...NO_RPE }),
  );
  const [trend] = deriveRepLaneTrends(days, WINDOW);
  expect(trend.earlier).toMatchObject({ observationCount: 2, median: 100 });
  expect(trend.recent).toMatchObject({ observationCount: 2, median: 110 });
  expect(trend.change).toEqual({
    status: "available",
    value: expect.closeTo(10, 10),
  });
});

it("includes the window start and recent boundary and excludes the exclusive end", () => {
  const days = [-1, 0, 20, 21, 41, 42, 50].map((day) =>
    daily(day, { rawKg: day < 21 ? 100 : 110, ...NO_RPE }),
  );
  const [trend] = deriveRepLaneTrends(days, WINDOW);
  expect(trend.earlier).toMatchObject({
    observationCount: 2,
    workoutCount: 2,
    median: 100,
  });
  expect(trend.recent).toMatchObject({
    observationCount: 2,
    workoutCount: 2,
    median: 110,
  });
});

it("uses the supplied earlier boundary instead of extending a 28-day window to 42 days", () => {
  const window = {
    earlierStartsAt: startOfLocalDay(atDay(14)),
    recentStartsAt: startOfLocalDay(atDay(28)),
    endExclusive: WINDOW.endExclusive,
  };
  const days = [-1, 0, 13, 14, 27, 28, 41, 42, 50].map((day) =>
    daily(day, {
      rawKg: day < 14 ? 1_000 : day < 28 ? 100 : 110,
      ...NO_RPE,
    }),
  );
  const [trend] = deriveRepLaneTrends(days, window);

  expect(trend.earlier).toMatchObject({ observationCount: 2, median: 100 });
  expect(trend.recent).toMatchObject({ observationCount: 2, median: 110 });
  expect(trend.change).toEqual({
    status: "available",
    value: expect.closeTo(10, 10),
  });
});

it("allows both presets to produce different changes from the same observations", () => {
  const days = [
    daily(0, { rawKg: 80, ...NO_RPE }),
    daily(7, { rawKg: 80, ...NO_RPE }),
    daily(14, { rawKg: 100, ...NO_RPE }),
    daily(20, { rawKg: 100, ...NO_RPE }),
    daily(28, { rawKg: 110, ...NO_RPE }),
    daily(35, { rawKg: 110, ...NO_RPE }),
  ];
  const [early] = deriveRepLaneTrends(
    days,
    createRepLaneWindow(WINDOW.endExclusive, "early"),
  );
  const [established] = deriveRepLaneTrends(
    days,
    createRepLaneWindow(WINDOW.endExclusive, "established"),
  );

  expect(early.earlier).toMatchObject({ observationCount: 2, median: 100 });
  expect(early.recent).toMatchObject({ observationCount: 2, median: 110 });
  expect(early.change).toEqual({
    status: "available",
    value: expect.closeTo(10, 10),
  });
  expect(established.earlier).toMatchObject({
    observationCount: 4,
    median: 90,
  });
  expect(established.recent).toMatchObject({
    observationCount: 2,
    median: 110,
  });
  expect(established.change).toEqual({
    status: "available",
    value: (110 / 90 - 1) * 100,
  });
});

it("keeps the established preset equivalent to the previous default boundaries", () => {
  const days = laneDays(
    [{ adjustedE1rm: 120 }, { adjustedE1rm: 124 }],
    [{ adjustedE1rm: 126 }, { adjustedE1rm: 130 }],
  );
  const window = createRepLaneWindow(WINDOW.endExclusive, "established");

  expect(window).toEqual(WINDOW);
  const [trend] = deriveRepLaneTrends(days, window);
  expect(trend).toEqual(deriveRepLaneTrends(days, WINDOW)[0]);
  expect(trend.basis).toBe("rpe_adjusted");
  expect(trend.earlier.median).toBe(122);
  expect(trend.recent.median).toBe(128);
  expect(trend.change).toEqual({
    status: "available",
    value: (128 / 122 - 1) * 100,
  });
});

it.each<Partial<RepLaneWindow>>([
  { earlierStartsAt: WINDOW.recentStartsAt },
  { earlierStartsAt: WINDOW.endExclusive },
  { recentStartsAt: WINDOW.earlierStartsAt },
  { recentStartsAt: WINDOW.endExclusive },
  { endExclusive: WINDOW.recentStartsAt },
  { earlierStartsAt: NaN },
  { recentStartsAt: Infinity },
  { endExclusive: Number.MAX_SAFE_INTEGER },
  { earlierStartsAt: -1 },
  { earlierStartsAt: atDay(0) },
  { recentStartsAt: atDay(21) },
  { endExclusive: atDay(42) },
])(
  "rejects invalid or nonchronological explicit boundaries %o",
  (overrides) => {
    expect(() => deriveRepLaneTrends([], { ...WINDOW, ...overrides })).toThrow(
      "Invalid rep-lane comparison window",
    );
  },
);

describe.each<RepLaneWindowMode>(["early", "established"])(
  "%s comparison safeguards",
  (mode) => {
    const window = createRepLaneWindow(WINDOW.endExclusive, mode);

    it("uses explicit boundaries independently of the legacy trendDays setting", () => {
      const days = [14, 17, 28, 31].map((day) => daily(day));
      const expected = deriveRepLaneTrends(days, window);

      expect(
        deriveRepLaneTrends(days, window, { ...progressConfig, trendDays: 1 }),
      ).toEqual(expected);
    });

    it("still requires two daily observations in each half", () => {
      const [trend] = deriveRepLaneTrends(
        [daily(14), daily(28), daily(31)],
        window,
      );
      expect(trend.basis).toBe("insufficient");
      expect(trend.change).toEqual({
        status: "unavailable",
        reason: "insufficient_history",
      });
    });

    it.each([
      { adjustedCount: 7, expectedBasis: "rpe_adjusted" },
      { adjustedCount: 6, expectedBasis: "raw_load" },
    ])(
      "retains the 70% coverage threshold with $adjustedCount/10 adjusted workouts per half",
      ({ adjustedCount, expectedBasis }) => {
        const days = [14, 17, 28, 31].map((day, index) =>
          daily(day, {
            workoutCount: 5,
            adjustedWorkoutCount: index % 2 === 0 ? 3 : adjustedCount - 3,
          }),
        );
        const [trend] = deriveRepLaneTrends(days, window);
        expect(trend.basis).toBe(expectedBasis);
        expect(trend.earlier.rpeCoverage).toBe(adjustedCount / 10);
        expect(trend.recent.rpeCoverage).toBe(adjustedCount / 10);
      },
    );

    it.each<"earlier" | "recent">(["earlier", "recent"])(
      "requires two adjusted days even with 90% coverage in the %s half",
      (period) => {
        const days = [14, 17, 28, 31].map((day, index) => {
          const target = period === "earlier" ? index < 2 : index >= 2;
          if (!target) return daily(day);
          return daily(
            day,
            index % 2 === 0
              ? { workoutCount: 9, adjustedWorkoutCount: 9 }
              : NO_RPE,
          );
        });
        const [trend] = deriveRepLaneTrends(days, window);
        expect(trend[period].rpeCoverage).toBe(0.9);
        expect(trend[period].adjustedObservationCount).toBe(1);
        expect(trend.basis).toBe("raw_load");
      },
    );

    it("preserves same-day aggregation, independent reps and missing days", () => {
      const days = dailyHistory(
        [14, 17, 28, 31].flatMap((day) => [
          exposure(day, {
            id: `morning_${day}`,
            sets: [
              { reps: 2, weight: day < 28 ? 100 : 110 },
              { reps: 5, weight: day < 28 ? 80 : 88 },
            ],
          }),
          exposure(day, {
            id: `evening_${day}`,
            sets: [{ reps: 5, weight: day < 28 ? 100 : 110, rpe: null }],
          }),
        ]),
      );
      const [twoReps, fiveReps] = deriveRepLaneTrends(days, window);

      expect(twoReps.reps).toBe(2);
      expect(twoReps.basis).toBe("rpe_adjusted");
      expect(fiveReps.reps).toBe(5);
      expect(fiveReps.basis).toBe("raw_load");
      expect(fiveReps.earlier).toMatchObject({
        observationCount: 2,
        workoutCount: 4,
        adjustedWorkoutCount: 2,
        rpeCoverage: 0.5,
        median: 90,
      });
      expect(fiveReps.recent).toMatchObject({
        observationCount: 2,
        workoutCount: 4,
        adjustedWorkoutCount: 2,
        rpeCoverage: 0.5,
        median: 99,
      });
    });

    it("does not mutate or share results between modes and ignores input ordering", () => {
      const days = [0, 7, 14, 20, 28, 35].map((day) =>
        Object.freeze(daily(day, { rawKg: 100 + day, ...NO_RPE })),
      );
      Object.freeze(days);
      Object.freeze(window);
      const snapshot = JSON.stringify(days);
      const first = deriveRepLaneTrends(days, window);
      const expected = deriveRepLaneTrends(days, window);
      const otherWindow = createRepLaneWindow(
        window.endExclusive,
        mode === "early" ? "established" : "early",
      );
      const other = deriveRepLaneTrends(days, otherWindow);
      const otherSnapshot = JSON.stringify(other);

      first[0].earlier.median = -1;
      expect(deriveRepLaneTrends(days, window)).toEqual(expected);
      expect(deriveRepLaneTrends([...days].reverse(), window)).toEqual(
        expected,
      );
      expect(JSON.stringify(other)).toBe(otherSnapshot);
      expect(JSON.stringify(days)).toBe(snapshot);
    });
  },
);

it.each([
  [2026, 3, 15],
  [2026, 10, 15],
  [2027, 0, 15],
])(
  "selects calendar-day halves across DST/year boundaries ending %i-%i-%i",
  (year, month, date) => {
    const endExclusive = new Date(year, month, date).getTime();
    const modes: readonly RepLaneWindowMode[] = ["early", "established"];
    for (const mode of modes) {
      const window = createRepLaneWindow(endExclusive, mode);
      const startsOn = localCalendarDay(window.earlierStartsAt);
      const recentStartsOn = localCalendarDay(window.recentStartsAt);
      const endExclusiveDay = localCalendarDay(window.endExclusive);
      const days = [
        startsOn - 1,
        startsOn,
        recentStartsOn - 1,
        recentStartsOn,
        endExclusiveDay - 1,
        endExclusiveDay,
        endExclusiveDay + 1,
      ].map((day) =>
        daily(0, {
          day,
          rawKg: day < recentStartsOn ? 100 : 110,
          ...NO_RPE,
        }),
      );
      const [trend] = deriveRepLaneTrends(days, window);
      expect(trend.earlier).toMatchObject({ observationCount: 2, median: 100 });
      expect(trend.recent).toMatchObject({ observationCount: 2, median: 110 });
    }
  },
);

it.each<RepLaneWindowMode>(["early", "established"])(
  "reuses the selected history's anchoring and gap-filtered sessions in %s mode",
  (mode) => {
    const sessions = deriveLiftSessions(
      [0, 3, 28, 31].map((day) => exposure(day)),
      "bench",
      atDay(50),
    );
    const selected = selectComparisonHistory(
      sessions,
      atDay(50),
      progressConfig,
    );
    const days = deriveDailyRepObservations(
      selected.comparisonSessions.map((session) => ({
        workoutId: session.workoutId,
        family: session.family,
        finishedAt: session.finishedAt,
        observations: deriveWorkoutRepObservations(session.strengthSets),
      })),
    );
    const [trend] = deriveRepLaneTrends(
      days,
      createRepLaneWindow(selected.endExclusive, mode),
    );
    expect(selected.gapReset).toBe(true);
    expect(selected.endExclusive).toBe(startOfLocalDay(atDay(32)));
    expect(trend.earlier.observationCount).toBe(0);
    expect(trend.recent.observationCount).toBe(2);
    expect(trend.basis).toBe("insufficient");
  },
);

it.each([0, -100, NaN, Infinity, -Infinity])(
  "rejects invalid or non-positive raw baselines %s",
  (rawKg) => {
    const [trend] = deriveRepLaneTrends(
      laneDays(
        [
          { rawKg, ...NO_RPE },
          { rawKg, ...NO_RPE },
        ],
        [{ ...NO_RPE }, { ...NO_RPE }],
      ),
      WINDOW,
    );
    expect(trend.change).toEqual({
      status: "unavailable",
      reason: "invalid_baseline",
    });
  },
);

it("does not silently compare a period containing a non-finite load", () => {
  const [trend] = deriveRepLaneTrends(
    laneDays(
      [{ ...NO_RPE }, { rawKg: NaN, ...NO_RPE }],
      [{ ...NO_RPE }, { ...NO_RPE }],
    ),
    WINDOW,
  );
  expect(trend.change).toEqual({
    status: "unavailable",
    reason: "invalid_baseline",
  });
});

it("rejects a non-finite recent calculation and an overflowing percentage", () => {
  const invalidRecent = deriveRepLaneTrends(
    laneDays(
      [{ ...NO_RPE }, { ...NO_RPE }],
      [
        { rawKg: Infinity, ...NO_RPE },
        { rawKg: Infinity, ...NO_RPE },
      ],
    ),
    WINDOW,
  )[0];
  const overflow = deriveRepLaneTrends(
    laneDays(
      Array.from({ length: 3 }, () => ({ rawKg: Number.MIN_VALUE, ...NO_RPE })),
      Array.from({ length: 3 }, () => ({ rawKg: Number.MAX_VALUE, ...NO_RPE })),
    ),
    WINDOW,
  )[0];
  expect(invalidRecent.change).toEqual({
    status: "unavailable",
    reason: "invalid_baseline",
  });
  expect(overflow.change).toEqual({
    status: "unavailable",
    reason: "invalid_baseline",
  });
});

it.each([NaN, Infinity, 0, -1])(
  "does not count invalid adjusted values %s as usable days",
  (adjustedE1rm) => {
    const period = [{}, { adjustedE1rm }];
    const [trend] = deriveRepLaneTrends(laneDays(period, period), WINDOW);
    expect(trend.basis).toBe("raw_load");
    expect(trend.earlier.adjustedObservationCount).toBe(1);
    expect(trend.recent.adjustedObservationCount).toBe(1);
  },
);

it("ignores unsupported rep counts", () => {
  const days = [0, 11, 1.5].flatMap((reps) =>
    laneDays([{ reps }, { reps }], [{ reps }, { reps }]),
  );
  expect(deriveRepLaneTrends(days, WINDOW)).toEqual([]);
});

it("preserves unrounded medians and percentage changes", () => {
  const [trend] = deriveRepLaneTrends(
    laneDays(
      [
        { rawKg: 100.01, ...NO_RPE },
        { rawKg: 100.02, ...NO_RPE },
      ],
      [
        { rawKg: 102.02, ...NO_RPE },
        { rawKg: 102.03, ...NO_RPE },
      ],
    ),
    WINDOW,
  );
  expect(trend.earlier.median).toBe(100.01 / 2 + 100.02 / 2);
  expect(trend.recent.median).toBe(102.02 / 2 + 102.03 / 2);
  expect(trend.change).toEqual({
    status: "available",
    value: ((102.02 / 2 + 102.03 / 2) / (100.01 / 2 + 100.02 / 2) - 1) * 100,
  });
});

it("produces identical output regardless of observation order", () => {
  const days = [2, 5].flatMap((reps) =>
    laneDays(
      [
        { reps, rawKg: 100, ...NO_RPE },
        { reps, rawKg: 110, ...NO_RPE },
      ],
      [
        { reps, rawKg: 115, ...NO_RPE },
        { reps, rawKg: 105, ...NO_RPE },
      ],
    ),
  );
  const expected = deriveRepLaneTrends(days, WINDOW);
  expect(deriveRepLaneTrends([...days].reverse(), WINDOW)).toEqual(expected);
  expect(
    deriveRepLaneTrends([...days.slice(3), ...days.slice(0, 3)], WINDOW),
  ).toEqual(expected);
});

it("leaves frozen observations, sources and window inputs unchanged", () => {
  const days = laneDays([{}, {}], [{}, {}]);
  const original = JSON.stringify(days);
  for (const observation of days) {
    for (const source of [
      ...observation.rawSources,
      ...observation.adjustedSources,
    ])
      Object.freeze(source);
    Object.freeze(observation.rawSources);
    Object.freeze(observation.adjustedSources);
    Object.freeze(observation);
  }
  Object.freeze(days);
  const window = Object.freeze({ ...WINDOW });
  const first = deriveRepLaneTrends(days, window);
  expect(deriveRepLaneTrends(days, window)).toEqual(first);
  expect(JSON.stringify(days)).toBe(original);
  expect(window).toEqual(WINDOW);
});
