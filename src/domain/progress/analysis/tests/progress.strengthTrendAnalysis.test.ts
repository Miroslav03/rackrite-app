import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  localCalendarDay,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import type { CompetitionLiftExposure } from "../../history/progress.history.types";
import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { deriveDailyRepObservations } from "../../strength/progress.dailyRepObservations";
import { deriveFallbackStrengthTrends } from "../../strength/progress.fallbackStrength";
import { deriveRepLaneTrends } from "../../strength/progress.repLaneTrends";
import { createRepLaneWindow } from "../../strength/progress.repLaneWindow";
import {
  atDay,
  exposure,
  type FixtureSet,
} from "../../tests/progress.test.helpers";
import { analyzeStrengthTrends } from "../progress.strengthTrendAnalysis";

const DAYS = [2, 10, 17, 24, 31, 41];

function laneHistory(
  lanes = [{ reps: 5, change: 5 }],
  family: LiftFamily = "bench",
): CompetitionLiftExposure[] {
  return DAYS.map((day, index) =>
    exposure(day, {
      family,
      id: `${family}_${day}`,
      sets: lanes.map(({ reps, change }) => ({
        reps,
        weight: index < 3 ? 100 : 100 * (1 + change / 100),
      })),
    }),
  );
}

function fallbackHistory(rpe: number | null = 8): CompetitionLiftExposure[] {
  return DAYS.map((day, index) =>
    exposure(day, {
      sets: [
        { reps: [8, 6, 4, 3, 2, 1][index], weight: index < 3 ? 100 : 125, rpe },
      ],
    }),
  );
}

function finishAt(
  source: CompetitionLiftExposure,
  finishedAt: number,
): CompetitionLiftExposure {
  return {
    ...source,
    workout: {
      ...source.workout,
      startedAt: finishedAt - 3_600_000,
      finishedAt,
    },
    entries: source.entries.map((entry) => ({
      ...entry,
      sets: entry.sets.map((set, index) => ({
        ...set,
        finishedAt:
          set.finishedAt === null ? null : finishedAt - 60_000 + index,
      })),
    })),
  };
}

describe("complete strength analysis", () => {
  it("returns Building History for all lifts when no completed workouts exist", () => {
    for (const history of [[], [exposure(41, { active: true })]]) {
      const result = analyzeStrengthTrends(history, atDay(41));
      expect(result.analysisTime).toBe(atDay(41));
      expect(Object.keys(result.lifts).sort()).toEqual([
        "bench",
        "deadlift",
        "squat",
      ]);
      for (const family of ["squat", "bench", "deadlift"] as const) {
        expect(result.lifts[family]).toEqual({
          family,
          status: "building_history",
          reason: "no_history",
          selected: { family, method: "building_history" },
          history: [],
          gapReset: false,
          repLaneTrends: [],
        });
      }
    }
  });

  it("analyzes Bench independently while other lifts have no history", () => {
    const { lifts } = analyzeStrengthTrends(laneHistory(), atDay(41));
    expect(lifts.bench).toMatchObject({
      family: "bench",
      status: "progressing",
      reason: "measured_improvement",
    });
    expect(lifts.squat.reason).toBe("no_history");
    expect(lifts.deadlift.reason).toBe("no_history");
  });

  it.each([
    { change: 5, status: "progressing" },
    { change: 0, status: "maintaining" },
    { change: -5, status: "regressing" },
    { change: 2, status: "progressing" },
    { change: -3, status: "regressing" },
  ])(
    "interprets a real $change% comparable trend as $status",
    ({ change, status }) => {
      const result = analyzeStrengthTrends(
        laneHistory([{ reps: 5, change }]),
        atDay(41),
      ).lifts.bench;
      expect(result.status).toBe(status);
      expect(result.selected).toMatchObject({
        method: "comparable",
        windowMode: "established",
        trend: {
          contributingReps: [5],
          agreement: "single_lane",
          change: { status: "available", value: expect.closeTo(change, 10) },
        },
      });
    },
  );

  it.each([
    {
      changes: [5, 4, -8],
      agreement: "major_conflict",
      reason: "major_conflict",
      overall: 4,
    },
    {
      changes: [2, 30],
      agreement: "uneven",
      reason: "uneven_performance",
      overall: 16,
    },
    {
      changes: [4, 3, -4],
      agreement: "meaningful_disagreement",
      reason: "measured_improvement",
      overall: 3,
    },
  ])(
    "preserves $agreement and every original lane",
    ({ changes, agreement, reason, overall }) => {
      const result = analyzeStrengthTrends(
        laneHistory(
          changes.map((change, index) => ({ reps: [2, 5, 8][index], change })),
        ),
        atDay(41),
      ).lifts.bench;
      expect(result).toMatchObject({
        status:
          agreement === "meaningful_disagreement" ? "progressing" : "unclear",
        reason,
        selected: {
          method: "comparable",
          trend: {
            agreement,
            change: { status: "available", value: expect.closeTo(overall, 10) },
          },
        },
      });
      expect(result.repLaneTrends).toHaveLength(changes.length);
      result.repLaneTrends.forEach((lane, index) => {
        expect(lane.change).toEqual({
          status: "available",
          value: expect.closeTo(changes[index], 10),
        });
        expect(lane.basis).toBe("rpe_adjusted");
        expect(lane.earlier).toMatchObject({
          observationCount: 3,
          workoutCount: 3,
          adjustedWorkoutCount: 3,
        });
      });
    },
  );

  it.each<FixtureSet>([
    { type: "warmup" },
    { reps: 11 },
    { weight: 0 },
    { rpe: 6 },
    { finished: false },
  ])(
    "distinguishes completed history with unusable strength sets: %j",
    (set) => {
      const result = analyzeStrengthTrends(
        [exposure(41, { sets: [set] })],
        atDay(41),
      ).lifts.bench;
      expect(result).toMatchObject({
        status: "building_history",
        reason: "no_performance",
        selected: { method: "building_history" },
        repLaneTrends: [],
      });
      expect(result.history).toHaveLength(1);
      expect(result.history[0].observations).toEqual([]);
    },
  );

  it("keeps a single eligible day and insufficient non-matching histories unavailable", () => {
    for (const days of [[41], [17, 20, 31, 41]]) {
      const result = analyzeStrengthTrends(
        days.map((day, index) =>
          exposure(day, { sets: [{ reps: index + 1 }] }),
        ),
        atDay(41),
      ).lifts.bench;
      expect(result).toMatchObject({
        status: "building_history",
        reason: "insufficient_history",
        selected: { method: "building_history" },
        repLaneTrends: [],
      });
      expect(result.selected).not.toHaveProperty("trend");
    }
  });
});

describe("candidate selection and explanation evidence", () => {
  it("uses early comparison when available 42-day history is immature", () => {
    const history = [18, 20, 25, 29, 33, 41].map((day) =>
      exposure(day, { sets: [{ weight: day < 28 ? 100 : 105 }] }),
    );
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    expect(result.selected).toMatchObject({
      method: "comparable",
      windowMode: "early",
      window: createRepLaneWindow(atDay(42), "early"),
      trend: { change: { status: "available", value: expect.closeTo(5, 10) } },
    });
    expect(result.repLaneTrends[0].earlier.observationCount).toBe(3);
    expect(result.repLaneTrends[0].recent.observationCount).toBe(3);
  });

  it.each([
    {
      rpe: 8,
      method: "rpe_adjusted_fallback",
      basis: "rpe_adjusted",
      earlier: 124.13793103448276,
      recent: 136.36363636363635,
    },
    {
      rpe: null,
      method: "raw_brzycki_fallback",
      basis: "raw_brzycki",
      earlier: 116.12903225806451,
      recent: 128.57142857142858,
    },
  ])(
    "selects $method across changing reps and preserves its original medians",
    ({ rpe, method, basis, earlier, recent }) => {
      const result = analyzeStrengthTrends(fallbackHistory(rpe), atDay(41))
        .lifts.bench;
      expect(result).toMatchObject({
        status: "progressing",
        repLaneTrends: [],
        selected: {
          method,
          windowMode: "established",
          trend: {
            basis,
            evidenceCap: "moderate",
            earlier: {
              observationCount: 3,
              median: expect.closeTo(earlier, 10),
            },
            recent: { observationCount: 3, median: expect.closeTo(recent, 10) },
            change: {
              status: "available",
              value: expect.closeTo((recent / earlier - 1) * 100, 10),
            },
          },
        },
      });
    },
  );

  it("prefers declining early comparable data over an improving established fallback", () => {
    const history = [
      ...[2, 10, 17].map((day) =>
        exposure(day, { sets: [{ reps: 8, weight: 80 }] }),
      ),
      ...[22, 24, 32, 41].map((day) =>
        exposure(day, { sets: [{ reps: 5, weight: day < 28 ? 100 : 95 }] }),
      ),
    ];
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    expect(result).toMatchObject({
      status: "regressing",
      selected: {
        method: "comparable",
        windowMode: "early",
        trend: {
          change: { status: "available", value: expect.closeTo(-5, 10) },
        },
      },
    });
    const [adjusted] = deriveFallbackStrengthTrends(
      result.history,
      createRepLaneWindow(atDay(42), "established"),
      "rpe_adjusted",
    );
    expect(adjusted.change).toMatchObject({ status: "available" });
    if (adjusted.change.status === "available")
      expect(adjusted.change.value).toBeGreaterThan(0);
  });

  it("prefers early adjusted fallback over mature established raw fallback", () => {
    const days = [2, 10, 17, 22, 24, 26, 30, 35, 41];
    const history = days.map((day, index) =>
      exposure(day, {
        sets: [
          {
            reps: [8, 8, 8, 6, 5, 4, 3, 2, 1][index],
            weight: day < 28 ? 100 : 125,
            rpe: index < 3 ? null : 8,
          },
        ],
      }),
    );
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    expect(result.selected).toMatchObject({
      method: "rpe_adjusted_fallback",
      windowMode: "early",
      trend: {
        earlier: { observationCount: 3, rpeCoverage: 0.75 },
        recent: { observationCount: 3, rpeCoverage: 1 },
      },
    });
    expect(
      deriveFallbackStrengthTrends(
        result.history,
        createRepLaneWindow(atDay(42), "established"),
        "raw_brzycki",
      )[0].change.status,
    ).toBe("available");
  });

  it("retains selected-window Step 3 measurements including an insufficient lane", () => {
    const history = laneHistory([
      { reps: 2, change: 2 },
      { reps: 5, change: 4 },
    ]);
    history.push(exposure(35, { id: "isolated_8_reps", sets: [{ reps: 8 }] }));
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    const selected = result.selected;
    expect(selected.method).toBe("comparable");
    if (selected.method !== "comparable")
      throw new Error("Expected comparable selection");
    expect(selected.trend.contributingReps).toEqual([2, 5]);
    expect(result.repLaneTrends).toEqual(
      deriveRepLaneTrends(
        deriveDailyRepObservations(result.history),
        selected.window,
      ),
    );
    expect(result.repLaneTrends.map((lane) => lane.reps)).toEqual([2, 5, 8]);
    expect(result.repLaneTrends[2].change).toEqual({
      status: "unavailable",
      reason: "insufficient_history",
    });
    expect(selected.trend.change).toEqual({
      status: "available",
      value: expect.closeTo(3, 10),
    });
    const earlyLanes = deriveRepLaneTrends(
      deriveDailyRepObservations(result.history),
      createRepLaneWindow(atDay(42), "early"),
    );
    expect(result.repLaneTrends).not.toEqual(earlyLanes);
  });
});

describe("Step 1 eligibility across the pipeline", () => {
  it.each([11, 12])(
    "does not move the anchor for a newer %i-rep-only workout",
    (reps) => {
      const history = laneHistory();
      const expected = analyzeStrengthTrends(history, atDay(45));
      const result = analyzeStrengthTrends(
        [
          ...history,
          exposure(45, { id: "unsupported", sets: [{ reps, rpe: 10 }] }),
        ],
        atDay(45),
      );
      expect(result).toEqual(expected);
      expect(result.lifts.bench.selected).toMatchObject({
        method: "comparable",
        window: { endExclusive: startOfLocalDay(atDay(42)) },
      });
      expect(result.lifts.bench.history).toHaveLength(6);
    },
  );

  it.each([21, 22, 24])(
    "does not bridge a genuine %i-day gap with an unsupported workout",
    (gap) => {
      const days = [0, 4, 8, 8 + gap, 12 + gap, 16 + gap];
      const history = days.map((day, index) =>
        exposure(day, { sets: [{ weight: index < 3 ? 100 : 105 }] }),
      );
      const analysisTime = atDay(days[days.length - 1]);
      const expected = analyzeStrengthTrends(history, analysisTime);
      const result = analyzeStrengthTrends(
        [
          ...history,
          exposure(19, { id: "unsupported_bridge", sets: [{ reps: 11 }] }),
        ],
        analysisTime,
      );
      expect(result).toEqual(expected);
      expect(result.lifts.bench.gapReset).toBe(gap > 21);
      expect(result.lifts.bench.reason).toBe(
        gap > 21 ? "training_gap" : "measured_improvement",
      );
    },
  );

  it("does not reset or discard valid history for an unsupported workout after a long break", () => {
    const history = laneHistory();
    const expected = analyzeStrengthTrends(history, atDay(70));
    const result = analyzeStrengthTrends(
      [
        ...history,
        exposure(70, { id: "unsupported_return", sets: [{ reps: 11 }] }),
      ],
      atDay(70),
    );
    expect(result).toEqual(expected);
    expect(result.lifts.bench).toMatchObject({
      status: "building_history",
      reason: "stale_history",
      gapReset: false,
      selected: { method: "comparable" },
    });
    expect(result.lifts.bench.history).toHaveLength(6);
  });

  it.each([14, 15, 20])(
    "does not refresh freshness using ineligible sessions after %i days",
    (days) => {
      const history = laneHistory();
      const analysisTime = atDay(41 + days);
      const expected = analyzeStrengthTrends(history, analysisTime);
      const result = analyzeStrengthTrends(
        [
          ...history,
          exposure(41 + days, { id: "unsupported", sets: [{ reps: 11 }] }),
          exposure(41 + days, { id: "warmup", sets: [{ type: "warmup" }] }),
          exposure(41 + days, { id: "invalid", sets: [{ weight: NaN }] }),
        ],
        analysisTime,
      );
      expect(result).toEqual(expected);
      expect(result.lifts.bench.status).toBe(
        days === 14 ? "progressing" : "building_history",
      );
      expect(result.lifts.bench.reason).toBe(
        days === 14 ? "measured_improvement" : "stale_history",
      );
    },
  );

  it.each([11, 12])(
    "keeps %i-rep-only logged history distinguishable from no history",
    (reps) => {
      const empty = analyzeStrengthTrends([], atDay(41)).lifts.bench;
      const logged = analyzeStrengthTrends(
        [exposure(41, { sets: [{ reps }] })],
        atDay(41),
      ).lifts.bench;
      expect(empty.reason).toBe("no_history");
      expect(logged).toMatchObject({
        status: "building_history",
        reason: "no_performance",
        gapReset: false,
        selected: { method: "building_history" },
        repLaneTrends: [],
      });
      expect(logged.history).toHaveLength(1);
      expect(logged.history[0].observations).toEqual([]);
    },
  );

  it.each([
    { method: "comparable", history: laneHistory() },
    { method: "rpe_adjusted_fallback", history: fallbackHistory() },
    { method: "raw_brzycki_fallback", history: fallbackHistory(null) },
  ])(
    "preserves valid observations and $method evidence when sessions also contain unsupported sets",
    ({ method, history }) => {
      const expected = analyzeStrengthTrends(history, atDay(41));
      const mixed = history.map((workout) => ({
        ...workout,
        entries: workout.entries.map((entry) => ({
          ...entry,
          sets: [
            ...entry.sets,
            {
              ...entry.sets[0],
              id: `unsupported_${entry.exercise.id}`,
              setIndex: entry.sets.length,
              weight: 200,
              reps: 11,
              rpe: 10,
            },
          ],
        })),
      }));
      const result = analyzeStrengthTrends(mixed, atDay(41));
      expect(result).toEqual(expected);
      expect(result.lifts.bench.selected.method).toBe(method);
    },
  );
});

describe("configured 1–10 rep performance range", () => {
  function repHistory(
    reps: number,
    rpe: number,
    family: LiftFamily = "bench",
  ): CompetitionLiftExposure[] {
    return DAYS.map((day, index) =>
      exposure(day, {
        family,
        id: `${family}_${day}`,
        sets: [{ reps, rpe, weight: index < 3 ? 100 : 105 }],
      }),
    );
  }

  it.each([9, 10])("supports %i-rep progression for every lift", (reps) => {
    const families = ["squat", "bench", "deadlift"] as const;
    const history = families.flatMap((family) => repHistory(reps, 10, family));
    const result = analyzeStrengthTrends(history, atDay(41));
    for (const family of families) {
      expect(result.lifts[family]).toMatchObject({
        status: "progressing",
        selected: {
          method: "comparable",
          trend: {
            contributingReps: [reps],
            measurementBasis: "rpe_adjusted",
            change: { status: "available", value: expect.closeTo(5, 10) },
          },
        },
      });
    }
  });

  it("excludes 11–12-rep workouts from anchors and segmentation", () => {
    const history = laneHistory();
    const expected = analyzeStrengthTrends(history, atDay(70));
    const result = analyzeStrengthTrends(
      [
        ...history,
        exposure(60, { id: "unsupported_11", sets: [{ reps: 11 }] }),
        exposure(70, { id: "unsupported_12", sets: [{ reps: 12 }] }),
      ],
      atDay(70),
    );
    expect(result).toEqual(expected);
    expect(result.lifts.bench).toMatchObject({
      reason: "stale_history",
      gapReset: false,
      selected: {
        method: "comparable",
        window: { endExclusive: startOfLocalDay(atDay(42)) },
      },
    });
  });

  it("keeps 8 reps at RPE 8 eligible for adjusted comparisons", () => {
    const result = analyzeStrengthTrends(repHistory(8, 8), atDay(41));
    expect(result.lifts.bench.selected).toMatchObject({
      method: "comparable",
      trend: { measurementBasis: "rpe_adjusted" },
    });
    expect(
      result.lifts.bench.history[0].observations[0].adjustedRepresentative
        ?.adjustedEstimate,
    ).toBeCloseTo(133.33333333333334, 10);
  });

  it.each([9, 10])(
    "uses raw load when %i reps at RPE 8 exceeds 10 effective reps",
    (reps) => {
      const result = analyzeStrengthTrends(repHistory(reps, 8), atDay(41));
      expect(result.lifts.bench.selected).toMatchObject({
        method: "comparable",
        trend: { measurementBasis: "raw_load" },
      });
      expect(
        result.lifts.bench.history.every(
          (workout) => workout.observations[0].adjustedRepresentative === null,
        ),
      ).toBe(true);
    },
  );

  it.each([10, null])(
    "preserves fallback selection and percentages with RPE %s",
    (rpe) => {
      const history = DAYS.map((day, index) =>
        exposure(day, {
          sets: [
            {
              reps: [8, 9, 10, 1, 2, 3][index],
              rpe,
              weight: index < 3 ? 100 : 150,
            },
          ],
        }),
      );
      const result = analyzeStrengthTrends(history, atDay(41));
      expect(result.lifts.bench.selected).toMatchObject({
        method: rpe === null ? "raw_brzycki_fallback" : "rpe_adjusted_fallback",
        trend: {
          earlier: { observationCount: 3 },
          recent: { observationCount: 3 },
          change: { status: "available", value: expect.closeTo(20, 10) },
        },
      });
    },
  );

  it("preserves the other algorithm settings", () => {
    const config = {
      ...progressConfig,
      progressPercent: 6,
      repLaneMinimumHalfDays: 4,
      strengthTrendStaleDays: 20,
    };
    const result = analyzeStrengthTrends(repHistory(9, 10), atDay(60), config)
      .lifts.bench;
    expect(result).toMatchObject({
      status: "maintaining",
      reason: "measured_maintenance",
      selected: {
        method: "rpe_adjusted_fallback",
        trend: {
          change: { status: "available", value: expect.closeTo(5, 10) },
        },
      },
    });
    expect(
      analyzeStrengthTrends(repHistory(9, 8), atDay(41), {
        ...config,
        minimumPerformanceRpe: 9,
      }).lifts.bench.reason,
    ).toBe("no_performance");
  });
});

describe("history segmentation and daily observations", () => {
  it.each([
    { gap: 20, reset: false },
    { gap: 21, reset: false },
    { gap: 22, reset: true },
  ])(
    "uses the existing boundary for a $gap-day performance gap",
    ({ gap, reset }) => {
      const days = [0, 7, 14, 14 + gap, 15 + gap, 41];
      const history = days.map((day) =>
        exposure(day, { sets: [{ weight: day < 21 ? 100 : 105 }] }),
      );
      const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
      expect(result.gapReset).toBe(reset);
      expect(result.history.map((workout) => workout.workoutId)).toEqual(
        days.slice(reset ? 3 : 0).map((day) => `workout_${day}`),
      );
      expect(result).toMatchObject({
        status: reset ? "building_history" : "progressing",
        reason: reset ? "training_gap" : "measured_improvement",
      });
    },
  );

  it("does not compare a single returning workout against pre-break history", () => {
    const history = [
      ...laneHistory().map((workout) =>
        finishAt(
          workout,
          addLocalCalendarDays(workout.workout.finishedAt ?? 0, -25),
        ),
      ),
      exposure(41, { id: "return", sets: [{ weight: 200 }] }),
    ];
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    expect(result).toMatchObject({
      status: "building_history",
      reason: "training_gap",
      gapReset: true,
      selected: { method: "building_history" },
      repLaneTrends: [],
    });
    expect(result.history.map((workout) => workout.workoutId)).toEqual([
      "return",
    ]);
    expect(history).toHaveLength(7);
  });

  it("does not bridge a Bench gap with unrelated or ineligible sessions", () => {
    const history = [
      exposure(0),
      exposure(10, { family: "squat", id: "squat" }),
      exposure(20, { sets: [{ type: "warmup" }] }),
      exposure(30),
    ];
    const result = analyzeStrengthTrends(history, atDay(30)).lifts.bench;
    expect(result.gapReset).toBe(true);
    expect(result.reason).toBe("training_gap");
    expect(result.history.map((workout) => workout.workoutId)).toEqual([
      "workout_30",
    ]);
  });

  it("aggregates same-day workouts once per day and preserves partial RPE coverage", () => {
    const history = [2, 10, 31, 41].flatMap((day) => [
      exposure(day, {
        id: `morning_${day}`,
        sets: [{ weight: day < 21 ? 100 : 110 }, { weight: 80 }],
      }),
      exposure(day, {
        id: `evening_${day}`,
        sets: [{ weight: day < 21 ? 120 : 130, rpe: null }],
      }),
    ]);
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    expect(result.selected.method).toBe("comparable");
    expect(result.history).toHaveLength(8);
    expect(result.repLaneTrends[0]).toMatchObject({
      basis: "raw_load",
      earlier: {
        observationCount: 2,
        workoutCount: 4,
        adjustedWorkoutCount: 2,
        rpeCoverage: 0.5,
        median: 110,
      },
      recent: { observationCount: 2, workoutCount: 4, median: 120 },
      change: {
        status: "available",
        value: expect.closeTo((120 / 110 - 1) * 100, 10),
      },
    });
    expect(result.history[0].observations[0].rawRepresentative).toMatchObject({
      workoutId: "evening_2",
      setId: "set_evening_2_0",
    });
  });

  it("does not turn multiple workouts on one day into enough comparison days", () => {
    const history = [17, 41].flatMap((day) =>
      [1, 2, 3].map((index) => exposure(day, { id: `day_${day}_${index}` })),
    );
    const result = analyzeStrengthTrends(history, atDay(41)).lifts.bench;
    expect(result.status).toBe("building_history");
    expect(result.selected.method).toBe("building_history");
  });

  it("keeps all competition families and their window anchors independent", () => {
    const history = [
      ...laneHistory([{ reps: 5, change: 5 }], "bench"),
      ...laneHistory([{ reps: 3, change: -5 }], "squat").map((workout) =>
        finishAt(
          workout,
          addLocalCalendarDays(workout.workout.finishedAt ?? 0, -5),
        ),
      ),
      ...laneHistory([{ reps: 2, change: 0 }], "deadlift").map((workout) =>
        finishAt(
          workout,
          addLocalCalendarDays(workout.workout.finishedAt ?? 0, -10),
        ),
      ),
    ];
    const { lifts } = analyzeStrengthTrends(history, atDay(41));
    expect(lifts.bench.status).toBe("progressing");
    expect(lifts.squat.status).toBe("regressing");
    expect(lifts.deadlift.status).toBe("maintaining");
    for (const [family, offset] of [
      ["bench", 0],
      ["squat", 5],
      ["deadlift", 10],
    ] as const) {
      const result = lifts[family];
      expect(result.history.every((workout) => workout.family === family)).toBe(
        true,
      );
      expect(result.repLaneTrends.every((lane) => lane.family === family)).toBe(
        true,
      );
      expect(result.selected).toMatchObject({
        method: "comparable",
        window: { endExclusive: startOfLocalDay(atDay(42 - offset)) },
      });
    }
  });

  it("keeps lift observations separate when all lifts share the same workouts", () => {
    const history = (["squat", "bench", "deadlift"] as const).flatMap(
      (family) =>
        DAYS.map((day, index) => {
          const change = family === "bench" ? 5 : family === "squat" ? -5 : 0;
          const source = exposure(day, {
            family,
            id: `shared_${day}`,
            sets: [{ weight: index < 3 ? 100 : 100 + change }],
          });
          const entryId = `entry_${family}_${day}`;
          return {
            ...source,
            entries: source.entries.map((entry) => ({
              exercise: { ...entry.exercise, id: entryId },
              sets: entry.sets.map((set) => ({
                ...set,
                id: `set_${family}_${day}`,
                workoutExerciseId: entryId,
              })),
            })),
          };
        }),
    );
    const { lifts } = analyzeStrengthTrends(history, atDay(41));
    expect(lifts.bench.status).toBe("progressing");
    expect(lifts.squat.status).toBe("regressing");
    expect(lifts.deadlift.status).toBe("maintaining");
    for (const family of ["squat", "bench", "deadlift"] as const) {
      expect(lifts[family].history.map((workout) => workout.workoutId)).toEqual(
        DAYS.map((day) => `shared_${day}`),
      );
      expect(lifts[family].repLaneTrends[0].earlier.workoutCount).toBe(3);
    }
  });

  it("does not truncate new history through legacy context or trend-window configuration", () => {
    const history = laneHistory();
    const result = analyzeStrengthTrends(history, atDay(41), {
      ...progressConfig,
      trendDays: 2,
      contextDays: 1,
    });
    expect(result.lifts.bench.history).toHaveLength(6);
    expect(result.lifts.bench.selected).toMatchObject({
      method: "comparable",
      windowMode: "established",
      window: createRepLaneWindow(atDay(42), "established"),
    });
  });

  it("passes the supplied configuration through history selection and calculations", () => {
    const result = analyzeStrengthTrends(laneHistory(), atDay(41), {
      ...progressConfig,
      progressPercent: 6,
    });
    expect(result.lifts.bench.status).toBe("maintaining");
    const insufficient = analyzeStrengthTrends(laneHistory(), atDay(41), {
      ...progressConfig,
      repLaneMinimumHalfDays: 4,
      fallbackMinimumHalfDays: 4,
    });
    expect(insufficient.lifts.bench.reason).toBe("insufficient_history");
    const reset = analyzeStrengthTrends(laneHistory(), atDay(41), {
      ...progressConfig,
      resetGapDays: 5,
    });
    expect(reset.lifts.bench.history).toHaveLength(1);
    expect(reset.lifts.bench.reason).toBe("training_gap");
  });
});

describe("performance anchors and freshness", () => {
  it.each([
    { days: 0, stale: false },
    { days: 10, stale: false },
    { days: 14, stale: false },
    { days: 15, stale: true },
    { days: 19, stale: true },
  ])(
    "keeps the original window after $days days without an eligible performance",
    ({ days, stale }) => {
      const result = analyzeStrengthTrends(laneHistory(), atDay(41 + days))
        .lifts.bench;
      expect(result).toMatchObject({
        status: stale ? "building_history" : "progressing",
        reason: stale ? "stale_history" : "measured_improvement",
        selected: {
          method: "comparable",
          window: createRepLaneWindow(atDay(42), "established"),
        },
      });
      expect(result.repLaneTrends).toHaveLength(1);
      expect(result.repLaneTrends[0].change.status).toBe("available");
    },
  );

  it("reports stale history even when no method has enough observations", () => {
    const result = analyzeStrengthTrends([exposure(41)], atDay(56)).lifts.bench;
    expect(result).toMatchObject({
      status: "building_history",
      reason: "stale_history",
      selected: { method: "building_history" },
    });
    expect(result.history).toHaveLength(1);
  });

  it("does not refresh a stale lift or shift its anchor for invalid, unrelated or future data", () => {
    const invalidTime = exposure(59, { id: "bad_timestamp" });
    invalidTime.workout.finishedAt = NaN;
    const history = [
      ...laneHistory(),
      exposure(59, { id: "warmup", sets: [{ type: "warmup" }] }),
      exposure(59, { family: "squat", id: "squat" }),
      exposure(59, { id: "variation", variation: true }),
      exposure(59, { id: "invalid_weight", sets: [{ weight: NaN }] }),
      exposure(59, { id: "active", active: true }),
      exposure(61, { id: "future" }),
      invalidTime,
    ];
    const result = analyzeStrengthTrends(history, atDay(60)).lifts.bench;
    expect(result).toMatchObject({
      status: "building_history",
      reason: "stale_history",
      selected: {
        method: "comparable",
        window: { endExclusive: startOfLocalDay(atDay(42)) },
      },
    });
    expect(result.history).toHaveLength(6);
  });

  it.each([
    new Date(2026, 2, 30),
    new Date(2026, 9, 26),
    new Date(2027, 0, 12),
  ])(
    "preserves local midnight anchors, day counts and freshness across DST/year boundaries ending %s",
    (end) => {
      const history = laneHistory().map((workout, index) =>
        finishAt(
          workout,
          addLocalCalendarDays(end.getTime(), DAYS[index] - 42) + 43_200_000,
        ),
      );
      const current = analyzeStrengthTrends(
        history,
        addLocalCalendarDays(end.getTime(), 13),
      ).lifts.bench;
      const stale = analyzeStrengthTrends(
        history,
        addLocalCalendarDays(end.getTime(), 14),
      ).lifts.bench;
      expect(current.status).toBe("progressing");
      expect(stale.reason).toBe("stale_history");
      expect(current.selected).toMatchObject({
        method: "comparable",
        window: createRepLaneWindow(end.getTime(), "established"),
      });
      expect(stale.selected).toEqual(current.selected);
      expect(current.repLaneTrends[0].earlier.observationCount).toBe(3);
      expect(current.repLaneTrends[0].recent.observationCount).toBe(3);
      expect(
        current.history.map((workout) => localCalendarDay(workout.finishedAt)),
      ).toEqual(DAYS.map((day) => localCalendarDay(end.getTime()) + day - 42));
    },
  );
});

describe("input integrity", () => {
  it.each([NaN, Infinity, -Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects invalid analysis time %s",
    (analysisTime) => {
      expect(() => analyzeStrengthTrends([], analysisTime)).toThrow(
        "Invalid progress analysis time",
      );
    },
  );

  it("handles empty history without attempting to create pre-epoch comparison windows", () => {
    expect(analyzeStrengthTrends([], 0).lifts.bench.reason).toBe("no_history");
  });

  it("is repeatable, order independent, duplicate safe and leaves frozen inputs unchanged", () => {
    const history = laneHistory([
      { reps: 2, change: 2 },
      { reps: 5, change: 4 },
    ]);
    const before = JSON.stringify(history);
    function freeze(value: unknown): void {
      if (value !== null && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
      }
    }
    freeze(history);
    const config = { ...progressConfig };
    freeze(config);
    const first = analyzeStrengthTrends(history, atDay(41), config);
    expect(analyzeStrengthTrends(history, atDay(41), config)).toEqual(first);
    const reordered = history
      .slice()
      .reverse()
      .map((workout) => ({
        ...workout,
        entries: workout.entries
          .slice()
          .reverse()
          .map((entry) => ({ ...entry, sets: entry.sets.slice().reverse() })),
      }));
    expect(analyzeStrengthTrends(reordered, atDay(41), config)).toEqual(first);
    expect(
      analyzeStrengthTrends([...history, ...history], atDay(41), config),
    ).toEqual(first);
    expect(JSON.stringify(history)).toBe(before);
  });
});
