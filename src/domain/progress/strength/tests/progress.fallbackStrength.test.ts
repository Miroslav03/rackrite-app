import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import {
  atDay,
  exposure,
  type FixtureSet,
} from "../../tests/progress.test.helpers";
import { selectComparisonHistory } from "../../trends/progress.trends.utils";
import { deriveDailyRepObservations } from "../progress.dailyRepObservations";
import type { WorkoutRepObservations } from "../progress.dailyRepObservations.types";
import { deriveFallbackStrengthTrends } from "../progress.fallbackStrength";
import type { FallbackStrengthBasis } from "../progress.fallbackStrength.types";
import { deriveOverallRepTrends } from "../progress.overallRepTrends";
import { deriveWorkoutRepObservations } from "../progress.repObservations";
import { deriveRepLaneTrends } from "../progress.repLaneTrends";
import type {
  RepLaneWindow,
  RepLaneWindowMode,
} from "../progress.repLaneTrends.types";
import { createRepLaneWindow } from "../progress.repLaneWindow";

const WINDOW = createRepLaneWindow(atDay(28), "early");
const BASES: FallbackStrengthBasis[] = ["rpe_adjusted", "raw_brzycki"];

function workouts(
  history: Parameters<typeof deriveLiftSessions>[0],
  family: LiftFamily = "bench",
): WorkoutRepObservations[] {
  return deriveLiftSessions(history, family, atDay(100)).map((session) => ({
    workoutId: session.workoutId,
    family: session.family,
    finishedAt: session.finishedAt,
    observations: deriveWorkoutRepObservations(session.strengthSets),
  }));
}

function input(earlier: readonly FixtureSet[], recent: readonly FixtureSet[]) {
  return workouts([
    ...earlier.map((set, index) =>
      exposure(index, { id: `earlier_${index}`, sets: [set] }),
    ),
    ...recent.map((set, index) =>
      exposure(14 + index, { id: `recent_${index}`, sets: [set] }),
    ),
  ]);
}

function sets(count: number, values: FixtureSet = {}): FixtureSet[] {
  return Array.from({ length: count }, () => values);
}

function coverageInput(earlierAdjusted: number, recentAdjusted: number) {
  return workouts(
    [earlierAdjusted, recentAdjusted].flatMap((adjusted, period) =>
      Array.from({ length: 10 }, (_, index) =>
        exposure(period * 14 + (index % 3), {
          id: `period_${period}_workout_${index}`,
          sets: [{ rpe: index < adjusted ? 8 : null }],
        }),
      ),
    ),
  );
}

it.each(BASES)(
  "returns no %s results for empty input or history outside the window",
  (basis) => {
    expect(deriveFallbackStrengthTrends([], WINDOW, basis)).toEqual([]);
    expect(
      deriveFallbackStrengthTrends(
        workouts([exposure(-1), exposure(28)]),
        WINDOW,
        basis,
      ),
    ).toEqual([]);
  },
);

it.each(BASES)(
  "qualifies exactly three daily observations per half for %s",
  (basis) => {
    const [trend] = deriveFallbackStrengthTrends(
      input(sets(3), sets(3, { weight: 105 })),
      WINDOW,
      basis,
    );
    expect(trend).toEqual({
      family: "bench",
      basis,
      earlier: {
        observationCount: 3,
        workoutCount: 3,
        adjustedWorkoutCount: 3,
        rpeCoverage: 1,
        median: basis === "rpe_adjusted" ? 120 : 112.5,
      },
      recent: {
        observationCount: 3,
        workoutCount: 3,
        adjustedWorkoutCount: 3,
        rpeCoverage: 1,
        median: basis === "rpe_adjusted" ? 126 : 118.125,
      },
      change: { status: "available", value: expect.closeTo(5, 10) },
      evidenceCap: "moderate",
    });
  },
);

it.each(BASES)(
  "requires three days independently in each half for %s",
  (basis) => {
    for (const [earlierCount, recentCount] of [
      [2, 3],
      [3, 2],
      [3, 0],
      [0, 3],
    ]) {
      const [trend] = deriveFallbackStrengthTrends(
        input(sets(earlierCount), sets(recentCount)),
        WINDOW,
        basis,
      );
      expect(trend.change).toEqual({
        status: "unavailable",
        reason: "insufficient_history",
      });
      expect(trend.evidenceCap).toBeNull();
      expect(trend.earlier.observationCount).toBe(earlierCount);
      expect(trend.recent.observationCount).toBe(recentCount);
    }
  },
);

it("keeps the fallback minimum independent of comparable and legacy minimums", () => {
  expect(progressConfig.fallbackMinimumHalfDays).toBe(3);
  expect(progressConfig.repLaneMinimumHalfDays).toBe(2);
  expect(progressConfig.minimumHalfDays).toBe(3);
  const data = input(sets(3), sets(3));
  expect(
    deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki", {
      ...progressConfig,
      fallbackMinimumHalfDays: 4,
    })[0].change.status,
  ).toBe("unavailable");
  expect(
    deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki", {
      ...progressConfig,
      repLaneMinimumHalfDays: 99,
      minimumHalfDays: 99,
    })[0].change.status,
  ).toBe("available");
});

it("compares adjusted medians with an unrounded percentage", () => {
  const [trend] = deriveFallbackStrengthTrends(
    input(
      [100, 122 / 1.2, 124 / 1.2].map((weight) => ({ weight })),
      [124 / 1.2, 105, 128 / 1.2].map((weight) => ({ weight })),
    ),
    WINDOW,
    "rpe_adjusted",
  );

  expect(trend.earlier.median).toBe(122);
  expect(trend.recent.median).toBe(126);
  expect(trend.change).toEqual({
    status: "available",
    value: (126 / 122 - 1) * 100,
  });
});

it.each(BASES)(
  "preserves negative, neutral and positive changes for %s",
  (basis) => {
    for (const weight of [90, 100, 110]) {
      const [trend] = deriveFallbackStrengthTrends(
        input(sets(3), sets(3, { weight })),
        WINDOW,
        basis,
      );
      expect(trend.change).toEqual({
        status: "available",
        value: expect.closeTo(weight - 100, 10),
      });
    }
  },
);

it("compares raw estimates across different reps without any RPE", () => {
  const [trend] = deriveFallbackStrengthTrends(
    input(
      [
        { weight: 100, reps: 8, rpe: null },
        { weight: 110, reps: 6, rpe: null },
        { weight: 120, reps: 4, rpe: null },
      ],
      [
        { weight: 130, reps: 2, rpe: null },
        { weight: 135, reps: 1, rpe: null },
        { weight: 125, reps: 3, rpe: null },
      ],
    ),
    WINDOW,
    "raw_brzycki",
  );

  const earlier = 110 * (36 / 31);
  const recent = 130 * (36 / 35);
  expect(trend.earlier.median).toBe(earlier);
  expect(trend.recent.median).toBe(recent);
  expect(trend.change).toEqual({
    status: "available",
    value: (recent / earlier - 1) * 100,
  });
  expect(trend.earlier.rpeCoverage).toBe(0);
  expect(trend.recent.rpeCoverage).toBe(0);
});

it("keeps raw calculations independent of recorded RPE", () => {
  const missing = deriveFallbackStrengthTrends(
    input(sets(3, { rpe: null }), sets(3, { weight: 110, rpe: null })),
    WINDOW,
    "raw_brzycki",
  );
  const recorded = deriveFallbackStrengthTrends(
    input(sets(3, { rpe: 10 }), sets(3, { weight: 110, rpe: 7 })),
    WINDOW,
    "raw_brzycki",
  );
  expect(recorded[0].change).toEqual(missing[0].change);
  expect(recorded[0].earlier.median).toBe(missing[0].earlier.median);
  expect(recorded[0].recent.median).toBe(missing[0].recent.median);
});

it("returns independent adjusted and raw candidates from the same input", () => {
  const data = input(sets(3, { rpe: 8 }), sets(3, { weight: 105, rpe: 10 }));
  const [adjusted] = deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted");
  const [raw] = deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki");

  expect(adjusted.change).toEqual({
    status: "available",
    value: (118.125 / 120 - 1) * 100,
  });
  expect(raw.change).toEqual({
    status: "available",
    value: expect.closeTo(5, 10),
  });
  expect(adjusted.evidenceCap).toBe("moderate");
  expect(raw.evidenceCap).toBe("moderate");
});

it("does not hide an unavailable adjusted candidate by automatically returning raw", () => {
  const data = input(sets(3), sets(3, { rpe: null }));
  const [adjusted] = deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted");
  const [raw] = deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki");
  expect(adjusted.basis).toBe("rpe_adjusted");
  expect(adjusted.change.status).toBe("unavailable");
  expect(adjusted.recent).toEqual({
    observationCount: 0,
    workoutCount: 3,
    adjustedWorkoutCount: 0,
    rpeCoverage: 0,
    median: null,
  });
  expect(adjusted.evidenceCap).toBeNull();
  expect(raw.change.status).toBe("available");
});

it("qualifies at exactly 70% usable workout coverage in each half", () => {
  const [trend] = deriveFallbackStrengthTrends(
    coverageInput(7, 7),
    WINDOW,
    "rpe_adjusted",
  );
  expect(trend.change.status).toBe("available");
  for (const period of [trend.earlier, trend.recent]) {
    expect(period).toMatchObject({
      observationCount: 3,
      workoutCount: 10,
      adjustedWorkoutCount: 7,
      rpeCoverage: 0.7,
    });
  }
});

it.each([
  [6, 10],
  [9, 5],
  [10, 6],
])(
  "requires coverage in both halves independently: %i/10 and %i/10",
  (earlier, recent) => {
    const data = coverageInput(earlier, recent);
    const [trend] = deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted");
    expect(trend.earlier.rpeCoverage).toBe(earlier / 10);
    expect(trend.recent.rpeCoverage).toBe(recent / 10);
    expect(trend.change).toEqual({
      status: "unavailable",
      reason: "insufficient_history",
    });
    expect(trend.evidenceCap).toBeNull();
    expect(
      deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki")[0].change
        .status,
    ).toBe("available");
  },
);

it("uses the configured coverage threshold without changing the shared default", () => {
  const data = coverageInput(7, 7);
  expect(
    deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted", {
      ...progressConfig,
      rpeCoverage: 0.8,
    })[0].change.status,
  ).toBe("unavailable");
  expect(progressConfig.rpeCoverage).toBe(0.7);
});

it("counts workouts rather than sets or the share of days with some adjusted data", () => {
  const data = workouts(
    [0, 1].flatMap((period) =>
      [0, 1, 2].flatMap((day) => [
        exposure(period * 14 + day, {
          id: `adjusted_${period}_${day}`,
          sets: sets(20),
        }),
        exposure(period * 14 + day, {
          id: `missing_${period}_${day}`,
          sets: [{ rpe: null }],
        }),
      ]),
    ),
  );
  const [trend] = deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted");
  expect(trend.earlier).toMatchObject({
    observationCount: 3,
    workoutCount: 6,
    adjustedWorkoutCount: 3,
    rpeCoverage: 0.5,
  });
  expect(trend.recent.rpeCoverage).toBe(0.5);
  expect(trend.change.status).toBe("unavailable");
});

it("requires three adjusted days even with coverage above 70%", () => {
  const data = workouts(
    [0, 1].flatMap((period) =>
      Array.from({ length: 9 }, (_, index) =>
        exposure(period * 14 + (index === 8 ? 2 : index % 2), {
          id: `${period}_${index}`,
          sets: [{ rpe: index === 8 ? null : 8 }],
        }),
      ),
    ),
  );
  const [trend] = deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted");
  expect(trend.earlier.observationCount).toBe(2);
  expect(trend.earlier.rpeCoverage).toBe(8 / 9);
  expect(trend.change.status).toBe("unavailable");
});

it("does not count unusable adjusted estimates toward coverage or days", () => {
  const data = input(
    sets(3, { reps: 10, rpe: 8 }),
    sets(3, { reps: 10, rpe: 8 }),
  );
  const [adjusted] = deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted");
  expect(adjusted.earlier).toMatchObject({
    observationCount: 0,
    workoutCount: 3,
    adjustedWorkoutCount: 0,
    rpeCoverage: 0,
  });
  expect(adjusted.recent.observationCount).toBe(0);
  expect(adjusted.change.status).toBe("unavailable");
  expect(
    deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki")[0].change.status,
  ).toBe("available");
});

it.each(BASES)(
  "does not turn three same-day workouts into three valid days for %s",
  (basis) => {
    const data = workouts(
      [0, 14].flatMap((day) =>
        Array.from({ length: 3 }, (_, index) =>
          exposure(day, {
            id: `${day}_${index}`,
            sets: [{ reps: 2 }, { reps: 5 }, { reps: 8 }],
          }),
        ),
      ),
    );
    const [trend] = deriveFallbackStrengthTrends(data, WINDOW, basis);
    expect(trend.earlier.observationCount).toBe(1);
    expect(trend.recent.observationCount).toBe(1);
    expect(trend.change.status).toBe("unavailable");
  },
);

it.each(BASES)(
  "gives daily medians equal weight regardless of workout frequency for %s",
  (basis) => {
    const data = workouts([
      ...[0, 1, 2].map((day) => exposure(day)),
      ...Array.from({ length: 5 }, (_, index) =>
        exposure(14, { id: `frequent_${index}`, sets: [{ weight: 200 }] }),
      ),
      exposure(15),
      exposure(16),
    ]);
    const [trend] = deriveFallbackStrengthTrends(data, WINDOW, basis);
    expect(trend.change).toEqual({ status: "available", value: 0 });
    expect(trend.recent.workoutCount).toBe(7);
    expect(trend.recent.observationCount).toBe(3);
  },
);

it.each(BASES)(
  "excludes invalid estimates instead of filling missing days with zero for %s",
  (basis) => {
    const data = input(sets(3), sets(3));
    const invalid = {
      ...data[0],
      workoutId: "invalid",
      observations: data[0].observations.map((observation) => {
        const source = {
          ...observation.rawRepresentative,
          rawEstimate: 0,
          adjustedEstimate: Infinity,
        };
        return {
          ...observation,
          rawRepresentative: source,
          adjustedRepresentative: source,
        };
      }),
    };
    expect(
      deriveFallbackStrengthTrends(
        [invalid, ...data.slice(1)],
        WINDOW,
        basis,
      )[0].change,
    ).toEqual({ status: "unavailable", reason: "insufficient_history" });
  },
);

it("returns invalid_baseline when valid positive medians overflow the percentage calculation", () => {
  const data = input(sets(3), sets(3)).map((workout, index) => ({
    ...workout,
    observations: workout.observations.map((observation) => ({
      ...observation,
      rawRepresentative: {
        ...observation.rawRepresentative,
        rawEstimate: index < 3 ? Number.MIN_VALUE : Number.MAX_VALUE,
      },
    })),
  }));
  const [trend] = deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki");
  expect(trend.earlier.median).toBe(Number.MIN_VALUE);
  expect(trend.recent.median).toBe(Number.MAX_VALUE);
  expect(trend.change).toEqual({
    status: "unavailable",
    reason: "invalid_baseline",
  });
  expect(trend.evidenceCap).toBeNull();
});

it.each(["early", "established"] as RepLaneWindowMode[])(
  "respects inclusive starts and the exclusive end in a %s window",
  (mode) => {
    const window = createRepLaneWindow(atDay(42), mode);
    const halfDays = mode === "early" ? 14 : 21;
    const start = 42 - 2 * halfDays;
    const split = 42 - halfDays;
    const data = workouts([
      exposure(start - 1, { sets: [{ weight: 500 }] }),
      ...[start, start + 1, split - 1].map((day) => exposure(day)),
      ...[split, split + 1, 41].map((day) =>
        exposure(day, { sets: [{ weight: 110 }] }),
      ),
      exposure(42, { sets: [{ weight: 500 }] }),
    ]);
    const [trend] = deriveFallbackStrengthTrends(data, window, "raw_brzycki", {
      ...progressConfig,
      trendDays: 2,
    });
    expect(trend.earlier.observationCount).toBe(3);
    expect(trend.recent.observationCount).toBe(3);
    expect(trend.change).toEqual({
      status: "available",
      value: expect.closeTo(10, 10),
    });
  },
);

it("allows independent window candidates without enforcing established-history maturity", () => {
  const data = workouts([10, 11, 12, 24, 25, 26].map((day) => exposure(day)));
  const established = createRepLaneWindow(atDay(42), "established");
  const early = createRepLaneWindow(atDay(42), "early");
  expect(
    deriveFallbackStrengthTrends(data, established, "rpe_adjusted")[0].change
      .status,
  ).toBe("available");
  expect(
    deriveFallbackStrengthTrends(data, early, "rpe_adjusted")[0].change.status,
  ).toBe("unavailable");
});

it.each([
  new Date(2027, 0, 10).getTime(),
  new Date(2026, 2, 30).getTime(),
  new Date(2026, 9, 26).getTime(),
])(
  "respects local calendar boundaries across year and DST changes ending %i",
  (end) => {
    for (const mode of ["early", "established"] as const) {
      const window = createRepLaneWindow(end, mode);
      const timestamps = [
        window.earlierStartsAt,
        addLocalCalendarDays(window.earlierStartsAt, 1),
        window.recentStartsAt - 1,
        window.recentStartsAt,
        addLocalCalendarDays(window.recentStartsAt, 1),
        window.endExclusive - 1,
      ];
      const data = input(sets(3), sets(3)).map((workout, index) => ({
        ...workout,
        finishedAt: timestamps[index],
      }));
      const [trend] = deriveFallbackStrengthTrends(
        data,
        window,
        "rpe_adjusted",
      );
      expect(trend.earlier.observationCount).toBe(3);
      expect(trend.recent.observationCount).toBe(3);
      expect(trend.change).toEqual({ status: "available", value: 0 });
    }
  },
);

it.each(BASES)(
  "rejects malformed windows consistently with Step 3 for %s",
  (basis) => {
    const malformed: RepLaneWindow = {
      ...WINDOW,
      recentStartsAt: WINDOW.earlierStartsAt,
    };
    expect(() => deriveFallbackStrengthTrends([], malformed, basis)).toThrow(
      "Invalid rep-lane comparison window",
    );
    expect(() =>
      deriveFallbackStrengthTrends([], { ...WINDOW, endExclusive: NaN }, basis),
    ).toThrow();
    expect(() =>
      deriveFallbackStrengthTrends(
        [],
        { ...WINDOW, earlierStartsAt: WINDOW.earlierStartsAt + 1 },
        basis,
      ),
    ).toThrow();
  },
);

it("does not infer observations for skipped days or weeks", () => {
  const data = workouts([0, 7, 21, 28].map((day) => exposure(day)));
  const window = createRepLaneWindow(atDay(42), "established");
  const [trend] = deriveFallbackStrengthTrends(data, window, "raw_brzycki");
  expect(trend.earlier.observationCount).toBe(2);
  expect(trend.recent.observationCount).toBe(2);
  expect(trend.change.status).toBe("unavailable");
});

it("keeps competition families separate and sorted, including insufficient families", () => {
  const data = (["squat", "bench", "deadlift"] as const).flatMap((family) =>
    workouts(
      (family === "squat" ? [0, 14] : [0, 1, 2, 14, 15, 16]).map((day) =>
        exposure(day, {
          family,
          sets: [{ weight: day < 14 ? 100 : family === "bench" ? 110 : 90 }],
        }),
      ),
      family,
    ),
  );
  const trends = deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki");
  expect(trends.map((trend) => trend.family)).toEqual([
    "bench",
    "deadlift",
    "squat",
  ]);
  expect(trends[0].change).toEqual({
    status: "available",
    value: expect.closeTo(10, 10),
  });
  expect(trends[1].change).toEqual({
    status: "available",
    value: expect.closeTo(-10, 10),
  });
  expect(trends[2].change.status).toBe("unavailable");
});

it.each(BASES)(
  "does not mutate inputs or inflate counts for repeated inputs, for %s",
  (basis) => {
    const data = input(sets(3), sets(3, { weight: 110 }));
    const snapshot = JSON.stringify(data);
    for (const workout of data) {
      for (const observation of workout.observations) {
        Object.freeze(observation.rawRepresentative);
        if (observation.adjustedRepresentative)
          Object.freeze(observation.adjustedRepresentative);
        Object.freeze(observation);
      }
      Object.freeze(workout.observations);
      Object.freeze(workout);
    }
    Object.freeze(data);
    const expected = deriveFallbackStrengthTrends(data, WINDOW, basis);
    expect(
      deriveFallbackStrengthTrends([...data].reverse(), WINDOW, basis),
    ).toEqual(expected);
    expect(
      deriveFallbackStrengthTrends([...data, ...data].reverse(), WINDOW, basis),
    ).toEqual(expected);
    expect(deriveFallbackStrengthTrends(data, WINDOW, basis)).toEqual(expected);
    expect(JSON.stringify(data)).toBe(snapshot);
  },
);

it("compares changing rep counts when Step 4 has no qualifying comparable lane", () => {
  const data = input(
    [
      { weight: 100, reps: 8 },
      { weight: 110, reps: 6 },
      { weight: 120, reps: 4 },
    ],
    [
      { weight: 130, reps: 2 },
      { weight: 135, reps: 1 },
      { weight: 125, reps: 3 },
    ],
  );
  expect(
    deriveOverallRepTrends(
      deriveRepLaneTrends(deriveDailyRepObservations(data), WINDOW),
    )[0].agreement,
  ).toBe("insufficient");
  expect(
    deriveFallbackStrengthTrends(data, WINDOW, "rpe_adjusted")[0].change.status,
  ).toBe("available");
  expect(
    deriveFallbackStrengthTrends(data, WINDOW, "raw_brzycki")[0].change.status,
  ).toBe("available");
});

it("uses only the caller-selected training segment without restoring pre-gap history", () => {
  const history = [0, 4, 8, 35, 39, 43].map((day) => exposure(day));
  const sessions = deriveLiftSessions(history, "bench", atDay(44));
  const context = selectComparisonHistory(sessions, atDay(44), progressConfig);
  const selected = context.comparisonSessions.map((session) => ({
    ...session,
    observations: deriveWorkoutRepObservations(session.strengthSets),
  }));
  const window = createRepLaneWindow(startOfLocalDay(atDay(44)), "established");
  const [trend] = deriveFallbackStrengthTrends(selected, window, "raw_brzycki");
  expect(trend.earlier.observationCount).toBe(0);
  expect(trend.recent.observationCount).toBe(3);
  expect(trend.change.status).toBe("unavailable");
});
