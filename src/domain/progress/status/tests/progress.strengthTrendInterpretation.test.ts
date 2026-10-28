import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import {
  available,
  unavailable,
} from "../../measurements/progress.measurements";
import type { UnavailableReason } from "../../measurements/progress.measurements.types";
import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { deriveDailyRepObservations } from "../../strength/progress.dailyRepObservations";
import type { WorkoutRepObservations } from "../../strength/progress.dailyRepObservations.types";
import { deriveFallbackStrengthTrends } from "../../strength/progress.fallbackStrength";
import { deriveOverallRepTrends } from "../../strength/progress.overallRepTrends";
import type { RepLaneAgreement } from "../../strength/progress.overallRepTrends.types";
import { deriveWorkoutRepObservations } from "../../strength/progress.repObservations";
import { deriveRepLaneTrends } from "../../strength/progress.repLaneTrends";
import type { RepLaneWindowMode } from "../../strength/progress.repLaneTrends.types";
import { createRepLaneWindow } from "../../strength/progress.repLaneWindow";
import { selectStrengthTrend } from "../../strength/progress.strengthTrendSelector";
import type {
  SelectedStrengthTrend,
  StrengthTrendWindowCandidates,
} from "../../strength/progress.strengthTrendSelector.types";
import { atDay, exposure } from "../../tests/progress.test.helpers";
import { selectComparisonHistory } from "../../trends/progress.trends.utils";
import { interpretStrengthTrend } from "../progress.strengthTrendInterpretation";
import type {
  StrengthTrendInterpretationInput,
  StrengthTrendStatus,
} from "../progress.strengthTrendInterpretation.types";

type ComparableSelection = Extract<
  SelectedStrengthTrend,
  { method: "comparable" }
>;
type FallbackSelection = Extract<
  SelectedStrengthTrend,
  { method: "rpe_adjusted_fallback" | "raw_brzycki_fallback" }
>;
const MODES: RepLaneWindowMode[] = ["early", "established"];
const FALLBACKS: FallbackSelection["method"][] = [
  "rpe_adjusted_fallback",
  "raw_brzycki_fallback",
];

function workouts(
  history: Parameters<typeof deriveLiftSessions>[0],
  family: LiftFamily = "bench",
): WorkoutRepObservations[] {
  return deriveLiftSessions(history, family, atDay(500)).map((session) => ({
    workoutId: session.workoutId,
    family: session.family,
    finishedAt: session.finishedAt,
    observations: deriveWorkoutRepObservations(session.strengthSets),
  }));
}

function comparable(
  value = 4,
  agreement: RepLaneAgreement = "consistent",
  windowMode: RepLaneWindowMode = "established",
): ComparableSelection {
  return {
    family: "bench",
    method: "comparable",
    windowMode,
    window: createRepLaneWindow(atDay(42), windowMode),
    trend: {
      family: "bench",
      change: available(value),
      contributingReps: [2, 5],
      agreement,
      measurementBasis: "rpe_adjusted",
      evidenceCap: "strong",
    },
  };
}

function fallback(
  method: FallbackSelection["method"],
  value = 4,
  windowMode: RepLaneWindowMode = "established",
): FallbackSelection {
  const adjusted = method === "rpe_adjusted_fallback";
  const period = {
    observationCount: 3,
    workoutCount: 3,
    adjustedWorkoutCount: adjusted ? 3 : 0,
    rpeCoverage: adjusted ? 1 : 0,
    median: 100,
  };
  return {
    family: "bench",
    method,
    windowMode,
    window: createRepLaneWindow(atDay(42), windowMode),
    trend: {
      family: "bench",
      basis: adjusted ? "rpe_adjusted" : "raw_brzycki",
      change: available(value),
      earlier: { ...period },
      recent: { ...period, median: 100 * (1 + value / 100) },
      evidenceCap: "moderate",
    },
  };
}

function input(
  selected: SelectedStrengthTrend = comparable(),
): StrengthTrendInterpretationInput {
  return {
    selected,
    analysisTime: atDay(42),
    history: workouts([2, 10, 17, 24, 31, 41].map((day) => exposure(day))),
  };
}

describe("percentage interpretation", () => {
  it.each<{ value: number; status: StrengthTrendStatus; reason: string }>([
    { value: 5, status: "progressing", reason: "measured_improvement" },
    { value: 2, status: "progressing", reason: "measured_improvement" },
    { value: 1.9, status: "maintaining", reason: "measured_maintenance" },
    { value: 0, status: "maintaining", reason: "measured_maintenance" },
    { value: -2.9, status: "maintaining", reason: "measured_maintenance" },
    { value: -3, status: "regressing", reason: "measured_decline" },
    { value: -5, status: "regressing", reason: "measured_decline" },
  ])(
    "classifies $value% as $status without changing the measurement",
    ({ value, status, reason }) => {
      const selected = comparable(value);
      const result = interpretStrengthTrend(input(selected));
      expect(result).toMatchObject({
        status,
        reason,
        family: "bench",
      });
      expect(result.selected).toBe(selected);
      expect(selected.trend.change).toEqual(available(value));
    },
  );

  it("uses configured epsilon around thresholds without rounding", () => {
    const { comparisonEpsilon: epsilon } = progressConfig;
    for (const [value, status] of [
      [2 - epsilon / 2, "progressing"],
      [2 - epsilon * 2, "maintaining"],
      [-3 + epsilon / 2, "regressing"],
      [-3 + epsilon * 2, "maintaining"],
      [1.999, "maintaining"],
      [-2.999, "maintaining"],
    ] as const) {
      const selected = comparable(value);
      expect(interpretStrengthTrend(input(selected)).status).toBe(status);
      expect(selected.trend.change).toEqual(available(value));
    }
  });

  it("uses supplied thresholds and ignores legacy neutral, confirmation and support rules", () => {
    const config = {
      ...progressConfig,
      progressPercent: 4,
      regressionPercent: -5,
      comparisonEpsilon: 0,
      neutralPercent: 99,
      confirmationDays: 99,
      supportDays: 99,
    };
    expect(interpretStrengthTrend(input(comparable(3)), config).status).toBe(
      "maintaining",
    );
    expect(interpretStrengthTrend(input(comparable(4)), config).status).toBe(
      "progressing",
    );
    expect(interpretStrengthTrend(input(comparable(-4)), config).status).toBe(
      "maintaining",
    );
    expect(interpretStrengthTrend(input(comparable(-5)), config).status).toBe(
      "regressing",
    );
  });
});

describe("comparable agreement safeguards", () => {
  it.each<RepLaneAgreement>([
    "consistent",
    "single_lane",
    "minor_disagreement",
    "meaningful_disagreement",
  ])("permits normal classification for %s", (agreement) => {
    const selected = comparable(3, agreement);
    if (agreement === "single_lane") selected.trend.contributingReps = [5];
    const result = interpretStrengthTrend(input(selected));
    expect(result).toMatchObject({
      status: "progressing",
      reason: "measured_improvement",
    });
    expect(result.selected).toBe(selected);
  });

  it.each<RepLaneAgreement>(["major_conflict", "uneven"])(
    "returns unclear for %s regardless of the median's direction",
    (agreement) => {
      for (const value of [16, 4, 0, -4, -10]) {
        const selected = comparable(value, agreement);
        const result = interpretStrengthTrend(input(selected));
        expect(result).toMatchObject({
          status: "unclear",
          reason:
            agreement === "major_conflict"
              ? "major_conflict"
              : "uneven_performance",
        });
        expect(result.selected).toBe(selected);
        expect(selected.trend.change).toEqual(available(value));
      }
    },
  );

  it.each<RepLaneAgreement>(["major_conflict", "uneven"])(
    "checks freshness and validity before %s",
    (agreement) => {
      const selected = comparable(4, agreement);
      const data = input(selected);
      data.analysisTime = atDay(56);
      expect(interpretStrengthTrend(data)).toMatchObject({
        status: "building_history",
        reason: "stale_history",
      });
      data.analysisTime = atDay(42);
      selected.trend.change = unavailable("invalid_baseline");
      expect(interpretStrengthTrend(data)).toMatchObject({
        status: "building_history",
        reason: "invalid_baseline",
      });
    },
  );
});

describe("fallback interpretation and selected metadata", () => {
  it.each(FALLBACKS)("applies percentage thresholds to %s", (method) => {
    for (const [value, status] of [
      [4, "progressing"],
      [-4, "regressing"],
      [0, "maintaining"],
      [0.5, "maintaining"],
    ] as const) {
      const selected = fallback(method, value);
      const result = interpretStrengthTrend(input(selected));
      expect(result.status).toBe(status);
      expect(result.selected).toBe(selected);
      expect(selected.trend).not.toHaveProperty("contributingReps");
    }
  });

  it.each(MODES)(
    "preserves %s window and calculation details for all methods",
    (mode) => {
      const selections = [
        comparable(4, "meaningful_disagreement", mode),
        ...FALLBACKS.map((method) => fallback(method, 4, mode)),
      ];
      for (const selected of selections) {
        const result = interpretStrengthTrend(input(selected));
        expect(result.selected).toBe(selected);
        expect(result.selected).toMatchObject({
          method: selected.method,
          windowMode: mode,
        });
        expect(result).not.toHaveProperty("evidence");
        expect(result).not.toHaveProperty("confirmed");
        expect(selected.window).toBe(
          result.selected.method === "building_history"
            ? undefined
            : result.selected.window,
        );
        if (result.selected.method !== "building_history") {
          expect(result.selected.trend).toBe(selected.trend);
          expect(result.selected.trend.change).toBe(selected.trend.change);
        }
      }
    },
  );

  it("returns only the conclusion and original selection", () => {
    for (const selected of [
      comparable(3, "meaningful_disagreement", "early"),
      ...FALLBACKS.map((method) => fallback(method, 4, "early")),
    ]) {
      expect(interpretStrengthTrend(input(selected))).toEqual({
        family: "bench",
        status: "progressing",
        reason: "measured_improvement",
        selected,
      });
    }
  });
});

describe("history availability and invalid selections", () => {
  const building: SelectedStrengthTrend = {
    method: "building_history",
    family: "bench",
  };

  it("distinguishes no lift history, no valid performances and insufficient comparisons", () => {
    const data = input(building);
    expect(interpretStrengthTrend({ ...data, history: [] })).toMatchObject({
      status: "building_history",
      reason: "no_history",
    });
    expect(
      interpretStrengthTrend({
        ...data,
        history: workouts([exposure(41, { family: "squat" })], "squat"),
      }).reason,
    ).toBe("no_history");
    expect(
      interpretStrengthTrend({
        ...data,
        history: data.history.map((workout) => ({
          ...workout,
          observations: [],
        })),
      }).reason,
    ).toBe("no_performance");
    expect(interpretStrengthTrend(data)).toMatchObject({
      status: "building_history",
      reason: "insufficient_history",
    });
  });

  it("uses explicit gap context only for insufficient history", () => {
    const data = {
      ...input(building),
      historyContext: { hadTrainingGap: true },
    };
    expect(interpretStrengthTrend(data).reason).toBe("training_gap");
    expect(interpretStrengthTrend({ ...data, history: [] }).reason).toBe(
      "no_history",
    );
    expect(interpretStrengthTrend({ ...data, historyContext: {} }).reason).toBe(
      "insufficient_history",
    );
    expect(
      interpretStrengthTrend({ ...data, selected: comparable() }).status,
    ).toBe("progressing");
  });

  it("reports known stale history even without a selectable comparison", () => {
    const data = input(building);
    data.analysisTime = atDay(100);
    expect(interpretStrengthTrend(data)).toMatchObject({
      status: "building_history",
      reason: "stale_history",
      selected: building,
    });
  });

  it.each([false, true])(
    "checks freshness before insufficient-history reasons with gap context %s",
    (hadTrainingGap) => {
      const data = {
        ...input(building),
        historyContext: { hadTrainingGap },
        analysisTime: atDay(55),
      };
      expect(interpretStrengthTrend(data).reason).toBe(
        hadTrainingGap ? "training_gap" : "insufficient_history",
      );
      expect(
        interpretStrengthTrend({ ...data, analysisTime: atDay(56) }).reason,
      ).toBe("stale_history");
    },
  );

  it.each<UnavailableReason>([
    "no_history",
    "no_performance",
    "insufficient_history",
    "missing_rpe",
    "partial_rpe",
    "invalid_baseline",
    "incomplete_period",
  ])(
    "preserves unavailable measurement reason %s without inventing zero",
    (reason) => {
      const selected = comparable();
      selected.trend.change = unavailable(reason);
      expect(interpretStrengthTrend(input(selected))).toMatchObject({
        status: "building_history",
        reason,
      });
      expect(selected.trend.change).toEqual(unavailable(reason));
    },
  );

  it.each([NaN, Infinity, -Infinity])(
    "rejects a non-finite change %s for every method",
    (value) => {
      for (const selected of [
        comparable(),
        ...FALLBACKS.map((method) => fallback(method)),
      ]) {
        selected.trend.change = { status: "available", value };
        expect(interpretStrengthTrend(input(selected))).toMatchObject({
          status: "building_history",
          reason: "invalid_baseline",
        });
      }
    },
  );

  it("rejects unavailable comparable metadata and mismatched selected family or basis", () => {
    for (const selected of [
      comparable(4, "insufficient"),
      {
        ...comparable(),
        trend: { ...comparable().trend, contributingReps: [] },
      },
    ]) {
      expect(interpretStrengthTrend(input(selected))).toMatchObject({
        status: "building_history",
        reason: "insufficient_history",
      });
    }
    const wrongFamily = comparable();
    wrongFamily.trend.family = "squat";
    const wrongBasis = fallback("raw_brzycki_fallback");
    wrongBasis.trend.basis = "rpe_adjusted";
    for (const selected of [wrongFamily, wrongBasis]) {
      expect(interpretStrengthTrend(input(selected))).toMatchObject({
        status: "building_history",
        reason: "invalid_baseline",
      });
    }
  });

  it.each([NaN, Infinity, -Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects invalid supplied analysis time %s",
    (analysisTime) => {
      expect(() =>
        interpretStrengthTrend({ ...input(), analysisTime }),
      ).toThrow("Invalid progress analysis time");
    },
  );
});

describe("per-lift freshness", () => {
  it.each([
    { days: 0, stale: false },
    { days: 7, stale: false },
    { days: 14, stale: false },
    { days: 15, stale: true },
    { days: 19, stale: true },
    { days: 22, stale: true },
  ])(
    "applies the new freshness rule at $days local days since the latest performance",
    ({ days, stale }) => {
      const data = input();
      data.analysisTime = atDay(41 + days);
      expect(interpretStrengthTrend(data)).toMatchObject({
        status: stale ? "building_history" : "progressing",
        reason: stale ? "stale_history" : "measured_improvement",
      });
    },
  );

  it("keeps new freshness configuration independent of legacy freshness and plateau regularity", () => {
    expect(progressConfig.strengthTrendStaleDays).toBe(14);
    expect(progressConfig.staleDays).toBe(21);
    expect(progressConfig.resetGapDays).toBe(21);
    const data = { ...input(), analysisTime: atDay(56) };
    expect(
      interpretStrengthTrend(data, {
        ...progressConfig,
        staleDays: 99,
        regularGapDays: 99,
      }).reason,
    ).toBe("stale_history");
    expect(
      interpretStrengthTrend(data, {
        ...progressConfig,
        strengthTrendStaleDays: 15,
      }).status,
    ).toBe("progressing");
  });

  it.each<LiftFamily>(["squat", "bench", "deadlift"])(
    "does not refresh %s using a different lift's workout",
    (family) => {
      const selected = comparable();
      selected.family = family;
      selected.trend.family = family;
      const other = family === "bench" ? "squat" : "bench";
      const data = input(selected);
      data.history = [
        ...workouts([exposure(20, { family })], family),
        ...workouts([exposure(41, { family: other })], other),
      ];
      expect(interpretStrengthTrend(data)).toMatchObject({
        family,
        status: "building_history",
        reason: "stale_history",
      });
    },
  );

  it("does not refresh from empty, invalid, warmup, easy, incomplete or variation observations", () => {
    const old = workouts([exposure(20)]);
    const excluded = workouts([
      exposure(36, { sets: [{ type: "warmup" }] }),
      exposure(37, { sets: [{ rpe: 6 }] }),
      exposure(38, { sets: [{ reps: 11 }] }),
      exposure(39, { sets: [{ finished: false }] }),
      exposure(40, { variation: true }),
    ]);
    const [recent] = workouts([exposure(41)]);
    const data = {
      ...input(),
      history: [...old, ...excluded, { ...recent, observations: [] }],
    };
    expect(interpretStrengthTrend(data).reason).toBe("stale_history");
    for (const rawEstimate of [NaN, Infinity, -Infinity, 0, -1]) {
      const invalid = {
        ...recent,
        observations: recent.observations.map((observation) => ({
          ...observation,
          rawRepresentative: { ...observation.rawRepresentative, rawEstimate },
        })),
      };
      expect(
        interpretStrengthTrend({ ...data, history: [...old, invalid] }).reason,
      ).toBe("stale_history");
      expect(
        interpretStrengthTrend({ ...data, history: [invalid] }).reason,
      ).toBe("no_performance");
    }
  });

  it("ignores future completions and invalid timestamps when finding the latest eligible performance", () => {
    const [old] = workouts([exposure(20)]);
    const [recent] = workouts([exposure(41)]);
    for (const finishedAt of [atDay(43), NaN, Infinity, -1]) {
      const data = { ...input(), history: [old, { ...recent, finishedAt }] };
      expect(interpretStrengthTrend(data).reason).toBe("stale_history");
    }
    const data = {
      ...input(),
      analysisTime: atDay(41) - 1,
      history: [old, recent],
    };
    expect(interpretStrengthTrend(data).reason).toBe("stale_history");
  });

  it("uses workout completion for freshness even when the source set was completed the previous day", () => {
    const [workout] = workouts([exposure(40)]);
    const data = {
      ...input(),
      analysisTime: atDay(55),
      history: [{ ...workout, finishedAt: atDay(41) }],
    };
    expect(interpretStrengthTrend(data).status).toBe("progressing");
  });

  it("retains stale selected percentages and boundaries exclusively as historical context", () => {
    for (const selected of [
      comparable(4),
      fallback("rpe_adjusted_fallback", -5, "early"),
      fallback("raw_brzycki_fallback", -5),
    ]) {
      const data = { ...input(selected), analysisTime: atDay(60) };
      const windowBefore = { ...selected.window };
      const result = interpretStrengthTrend(data);
      expect(result).toMatchObject({
        status: "building_history",
        reason: "stale_history",
      });
      expect(result.selected).toBe(selected);
      expect(selected.window).toEqual(windowBefore);
    }
  });

  it.each([
    {
      last: new Date(2026, 1, 28, 23, 59),
      current: new Date(2026, 2, 14),
      stale: new Date(2026, 2, 15),
    },
    {
      last: new Date(2026, 11, 31, 23, 59),
      current: new Date(2027, 0, 14),
      stale: new Date(2027, 0, 15),
    },
    {
      last: new Date(2026, 2, 22, 23, 59),
      current: new Date(2026, 3, 5),
      stale: new Date(2026, 3, 6),
    },
    {
      last: new Date(2026, 9, 18, 23, 59),
      current: new Date(2026, 10, 1),
      stale: new Date(2026, 10, 2),
    },
  ])(
    "counts local dates across month/year/DST boundaries from $last",
    ({ last, current, stale }) => {
      const [workout] = workouts([exposure(41)]);
      const selected = comparable();
      selected.window = createRepLaneWindow(
        addLocalCalendarDays(startOfLocalDay(last.getTime()), 1),
        "established",
      );
      const data = {
        selected,
        history: [{ ...workout, finishedAt: last.getTime() }],
        analysisTime: current.getTime(),
      };
      expect(interpretStrengthTrend(data).status).toBe("progressing");
      expect(
        interpretStrengthTrend({ ...data, analysisTime: stale.getTime() })
          .reason,
      ).toBe("stale_history");
    },
  );

  it("uses the supplied analysis time while preserving the original last-performance window anchor", () => {
    const data = input();
    const first = interpretStrengthTrend(data);
    const later = interpretStrengthTrend({ ...data, analysisTime: atDay(56) });
    expect(first.status).toBe("progressing");
    expect(later.reason).toBe("stale_history");
    expect(later.selected).toBe(first.selected);
  });
});

describe("upstream composition and training gaps", () => {
  function interpretHistory(
    history: Parameters<typeof deriveLiftSessions>[0],
    analysisTime: number,
  ) {
    const sessions = deriveLiftSessions(history, "bench", analysisTime);
    const segment = selectComparisonHistory(
      sessions,
      analysisTime,
      progressConfig,
    );
    const observations = segment.contextDays
      .flatMap((day) => day.sessions)
      .map((session) => ({
        workoutId: session.workoutId,
        family: session.family,
        finishedAt: session.finishedAt,
        observations: deriveWorkoutRepObservations(session.strengthSets),
      }));
    const daily = deriveDailyRepObservations(observations);
    function candidates(
      mode: RepLaneWindowMode,
    ): StrengthTrendWindowCandidates {
      const window = createRepLaneWindow(segment.endExclusive, mode);
      return {
        window,
        comparable: deriveOverallRepTrends(
          deriveRepLaneTrends(daily, window),
        )[0],
        adjustedFallback: deriveFallbackStrengthTrends(
          observations,
          window,
          "rpe_adjusted",
        )[0],
        rawFallback: deriveFallbackStrengthTrends(
          observations,
          window,
          "raw_brzycki",
        )[0],
      };
    }
    const selected = selectStrengthTrend({
      family: "bench",
      history: observations,
      early: candidates("early"),
      established: candidates("established"),
    });
    return {
      segment,
      result: interpretStrengthTrend({
        selected,
        history: observations,
        analysisTime,
        historyContext: { hadTrainingGap: segment.gapReset },
      }),
    };
  }

  it("interprets a real single-lane comparison immediately without legacy confirmation", () => {
    const { result } = interpretHistory(
      [2, 10, 17, 24, 31, 41].map((day) =>
        exposure(day, { sets: [{ weight: day < 21 ? 100 : 105 }] }),
      ),
      atDay(41),
    );
    expect(result).toMatchObject({
      status: "progressing",
      reason: "measured_improvement",
      selected: {
        method: "comparable",
        windowMode: "established",
        trend: { agreement: "single_lane" },
      },
    });
  });

  it.each([
    {
      rpe: 8,
      method: "rpe_adjusted_fallback",
    },
    { rpe: null, method: "raw_brzycki_fallback" },
  ])(
    "interprets a real $method selection when rep counts change",
    ({ rpe, method }) => {
      const { result } = interpretHistory(
        [2, 10, 17, 24, 31, 41].map((day, index) =>
          exposure(day, {
            sets: [
              {
                reps: [8, 6, 4, 2, 3, 1][index],
                weight: index < 3 ? 100 : 125,
                rpe,
              },
            ],
          }),
        ),
        atDay(41),
      );
      expect(result).toMatchObject({
        status: "progressing",
        selected: {
          method,
          windowMode: "established",
          trend: {
            evidenceCap: "moderate",
            earlier: { observationCount: 3 },
            recent: { observationCount: 3 },
          },
        },
      });
    },
  );

  it.each([
    { gap: 20, reset: false },
    { gap: 21, reset: false },
    { gap: 22, reset: true },
  ])("respects upstream segmentation for a $gap-day gap", ({ gap, reset }) => {
    const days = [0, 7, 14, 14 + gap, 15 + gap, 41];
    const { segment, result } = interpretHistory(
      days.map((day) =>
        exposure(day, { sets: [{ weight: day < 21 ? 100 : 105 }] }),
      ),
      atDay(41),
    );
    expect(segment.gapReset).toBe(reset);
    expect(result).toMatchObject({
      status: reset ? "building_history" : "progressing",
      reason: reset ? "training_gap" : "measured_improvement",
    });
  });

  it("keeps a single returning session in Building History after a gap reset", () => {
    const { segment, result } = interpretHistory(
      [0, 7, 14, 39].map((day) => exposure(day)),
      atDay(39),
    );
    expect(segment.contextDays).toHaveLength(1);
    expect(result).toMatchObject({
      status: "building_history",
      reason: "training_gap",
      selected: { method: "building_history" },
    });
  });

  it("preserves actual comparable agreement when interpreting a balanced conflict", () => {
    const selected = comparable();
    const lanePeriod = {
      observationCount: 2,
      adjustedObservationCount: 2,
      workoutCount: 2,
      adjustedWorkoutCount: 2,
      rpeCoverage: 1,
      median: 100,
    };
    selected.trend = deriveOverallRepTrends(
      [4, -4].map((value, index) => ({
        family: "bench",
        reps: index === 0 ? 2 : 5,
        basis: "rpe_adjusted",
        earlier: lanePeriod,
        recent: { ...lanePeriod, median: 100 * (1 + value / 100) },
        change: available(value),
      })),
    )[0];
    expect(selected.trend.agreement).toBe("major_conflict");
    expect(interpretStrengthTrend(input(selected))).toMatchObject({
      status: "unclear",
      reason: "major_conflict",
      selected: { trend: { change: available(0) } },
    });
  });
});

it("is repeatable, independent of input order and leaves frozen source data unchanged", () => {
  for (const selected of [
    comparable(),
    fallback("rpe_adjusted_fallback"),
    fallback("raw_brzycki_fallback"),
  ]) {
    const data = input(selected);
    data.history = workouts([
      exposure(2, { sets: [{ reps: 5 }, { reps: 2 }] }),
      exposure(41),
    ]);
    const snapshot = JSON.stringify(data);
    for (const workout of data.history) {
      for (const observation of workout.observations) {
        Object.freeze(observation.rawRepresentative);
        if (observation.adjustedRepresentative)
          Object.freeze(observation.adjustedRepresentative);
        Object.freeze(observation);
      }
      Object.freeze(workout.observations);
      Object.freeze(workout);
    }
    Object.freeze(data.history);
    Object.freeze(selected.window);
    Object.freeze(selected.trend.change);
    if (selected.method === "comparable")
      Object.freeze(selected.trend.contributingReps);
    else {
      Object.freeze(selected.trend.earlier);
      Object.freeze(selected.trend.recent);
    }
    Object.freeze(selected.trend);
    Object.freeze(selected);
    Object.freeze(data);
    const expected = interpretStrengthTrend(data);
    expect(interpretStrengthTrend(data)).toEqual(expected);
    const reordered = data.history
      .slice()
      .reverse()
      .map((workout) => ({
        ...workout,
        observations: workout.observations.slice().reverse(),
      }));
    expect(interpretStrengthTrend({ ...data, history: reordered })).toEqual(
      expected,
    );
    expect(JSON.stringify(data)).toBe(snapshot);
  }
});
