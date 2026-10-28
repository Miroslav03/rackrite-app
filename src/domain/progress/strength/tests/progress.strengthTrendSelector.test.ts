import type { LiftFamily } from "@/domain/domain.types";
import {
  addLocalCalendarDays,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import {
  available,
  unavailable,
} from "../../measurements/progress.measurements";
import { progressConfig } from "../../progress.config";
import { deriveLiftSessions } from "../../sessions/progress.sessions";
import { atDay, exposure } from "../../tests/progress.test.helpers";
import { selectComparisonHistory } from "../../trends/progress.trends.utils";
import { deriveDailyRepObservations } from "../progress.dailyRepObservations";
import type { WorkoutRepObservations } from "../progress.dailyRepObservations.types";
import { deriveFallbackStrengthTrends } from "../progress.fallbackStrength";
import type {
  FallbackStrengthBasis,
  FallbackStrengthTrend,
} from "../progress.fallbackStrength.types";
import { deriveOverallRepTrends } from "../progress.overallRepTrends";
import type {
  OverallRepTrend,
  RepLaneAgreement,
} from "../progress.overallRepTrends.types";
import { deriveWorkoutRepObservations } from "../progress.repObservations";
import { deriveRepLaneTrends } from "../progress.repLaneTrends";
import type { RepLaneWindowMode } from "../progress.repLaneTrends.types";
import { createRepLaneWindow } from "../progress.repLaneWindow";
import {
  hasEstablishedLiftHistory,
  selectStrengthTrend,
} from "../progress.strengthTrendSelector";
import type {
  StrengthTrendCandidates,
  StrengthTrendWindowCandidates,
} from "../progress.strengthTrendSelector.types";

const WINDOWS = {
  early: createRepLaneWindow(atDay(42), "early"),
  established: createRepLaneWindow(atDay(42), "established"),
};
const MODES: RepLaneWindowMode[] = ["established", "early"];
const METHODS = [
  "comparable",
  "rpe_adjusted_fallback",
  "raw_brzycki_fallback",
] as const;

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

function comparable(overrides: Partial<OverallRepTrend> = {}): OverallRepTrend {
  return {
    family: "bench",
    change: available(2),
    contributingReps: [5],
    agreement: "single_lane",
    measurementBasis: "rpe_adjusted",
    evidenceCap: "strong",
    ...overrides,
  };
}

function fallback(
  basis: FallbackStrengthBasis,
  overrides: Partial<FallbackStrengthTrend> = {},
): FallbackStrengthTrend {
  const period = {
    observationCount: 3,
    workoutCount: 3,
    adjustedWorkoutCount: basis === "rpe_adjusted" ? 3 : 0,
    rpeCoverage: basis === "rpe_adjusted" ? 1 : 0,
    median: 100,
  };
  return {
    family: "bench",
    basis,
    change: available(4),
    earlier: { ...period },
    recent: { ...period, median: 104 },
    evidenceCap: "moderate",
    ...overrides,
  };
}

function candidates(): StrengthTrendCandidates {
  return {
    family: "bench",
    history: workouts([exposure(2), exposure(20), exposure(38)]),
    early: { window: WINDOWS.early },
    established: { window: WINDOWS.established },
  };
}

function allCandidates(): StrengthTrendCandidates {
  const input = candidates();
  for (const mode of MODES) {
    input[mode].comparable = comparable();
    input[mode].adjustedFallback = fallback("rpe_adjusted");
    input[mode].rawFallback = fallback("raw_brzycki");
  }
  return input;
}

function setOnlyCandidate(
  input: StrengthTrendCandidates,
  method: (typeof METHODS)[number],
  mode: RepLaneWindowMode,
): void {
  if (method === "comparable") input[mode].comparable = comparable();
  else if (method === "rpe_adjusted_fallback")
    input[mode].adjustedFallback = fallback("rpe_adjusted");
  else input[mode].rawFallback = fallback("raw_brzycki");
}

describe("method priority", () => {
  it.each([0, 1, 2, 3, 4, 5, 6])(
    "selects the first eligible candidate after skipping %i unavailable candidates",
    (skip) => {
      const input = allCandidates();
      const ordered = METHODS.flatMap((method) =>
        MODES.map((mode) => ({ method, mode })),
      );
      const trends = [
        input.established.comparable,
        input.early.comparable,
        input.established.adjustedFallback,
        input.early.adjustedFallback,
        input.established.rawFallback,
        input.early.rawFallback,
      ];
      trends.slice(0, skip).forEach((trend) => {
        if (trend) trend.change = unavailable("insufficient_history");
      });

      const result = selectStrengthTrend(input);
      if (skip === ordered.length) {
        expect(result).toEqual({ method: "building_history", family: "bench" });
      } else {
        expect(result).toMatchObject({
          method: ordered[skip].method,
          windowMode: ordered[skip].mode,
          family: "bench",
        });
        if (result.method !== "building_history") {
          expect(result.trend).toBe(trends[skip]);
          expect(result.window).toBe(input[ordered[skip].mode].window);
        }
      }
    },
  );

  it("prefers 28-day comparable to a larger 42-day adjusted or raw gain", () => {
    const input = allCandidates();
    input.established.comparable = undefined;
    input.early.comparable = comparable({ change: available(0.25) });
    input.established.adjustedFallback = fallback("rpe_adjusted", {
      change: available(15),
    });
    input.established.rawFallback = fallback("raw_brzycki", {
      change: available(30),
    });
    expect(selectStrengthTrend(input)).toMatchObject({
      method: "comparable",
      windowMode: "early",
      trend: { change: available(0.25) },
    });
  });

  it("prefers 28-day adjusted to a larger 42-day raw gain", () => {
    const input = candidates();
    input.early.adjustedFallback = fallback("rpe_adjusted", {
      change: available(3.5),
    });
    input.established.rawFallback = fallback("raw_brzycki", {
      change: available(4.8),
    });
    input.early.rawFallback = fallback("raw_brzycki", {
      change: available(5.1),
    });
    expect(selectStrengthTrend(input)).toMatchObject({
      method: "rpe_adjusted_fallback",
      windowMode: "early",
      trend: { change: available(3.5) },
    });
  });

  it.each(METHODS)("accepts negative and zero changes for %s", (method) => {
    for (const value of [-5, 0]) {
      const input = allCandidates();
      input.established.comparable = undefined;
      input.early.comparable = undefined;
      input.established.adjustedFallback = undefined;
      input.early.adjustedFallback = undefined;
      setOnlyCandidate(input, method, "established");
      setOnlyCandidate(input, method, "early");
      const bundle = input.established;
      const trend =
        method === "comparable"
          ? bundle.comparable
          : method === "rpe_adjusted_fallback"
            ? bundle.adjustedFallback
            : bundle.rawFallback;
      if (!trend) throw new Error("Missing test candidate");
      trend.change = available(value);
      expect(selectStrengthTrend(input)).toMatchObject({
        method,
        windowMode: "established",
        trend: { change: available(value) },
      });
    }
  });
});

describe("candidate eligibility", () => {
  it.each<RepLaneAgreement>([
    "single_lane",
    "consistent",
    "minor_disagreement",
    "meaningful_disagreement",
    "major_conflict",
    "uneven",
  ])("preserves selectable comparable agreement %s", (agreement) => {
    const input = allCandidates();
    const trend = comparable({ agreement, measurementBasis: "mixed" });
    input.established.comparable = trend;
    const selected = selectStrengthTrend(input);
    expect(selected.method).toBe("comparable");
    if (selected.method === "comparable") expect(selected.trend).toBe(trend);
  });

  it.each<Partial<OverallRepTrend>>([
    { contributingReps: [] },
    { agreement: "insufficient" },
    { change: unavailable("invalid_baseline") },
    { change: { status: "available", value: NaN } },
    { change: { status: "available", value: Infinity } },
    { change: { status: "available", value: -Infinity } },
    { family: "squat" },
  ])("skips an ineligible comparable candidate: %j", (overrides) => {
    const input = allCandidates();
    input.established.comparable = comparable(overrides);
    expect(selectStrengthTrend(input)).toMatchObject({
      method: "comparable",
      windowMode: "early",
    });
  });

  it.each<FallbackStrengthBasis>(["rpe_adjusted", "raw_brzycki"])(
    "skips unavailable, non-finite, wrong-family and wrong-basis %s fallbacks",
    (basis) => {
      const field =
        basis === "rpe_adjusted" ? "adjustedFallback" : "rawFallback";
      for (const overrides of [
        { change: unavailable("missing_rpe") },
        { change: { status: "available" as const, value: NaN } },
        { change: { status: "available" as const, value: Infinity } },
        { change: { status: "available" as const, value: -Infinity } },
        { family: "squat" as const },
        {
          basis:
            basis === "rpe_adjusted"
              ? ("raw_brzycki" as const)
              : ("rpe_adjusted" as const),
        },
      ]) {
        const input = candidates();
        input.established[field] = fallback(basis, overrides);
        input.early[field] = fallback(basis);
        expect(selectStrengthTrend(input)).toMatchObject({
          method:
            basis === "rpe_adjusted"
              ? "rpe_adjusted_fallback"
              : "raw_brzycki_fallback",
          windowMode: "early",
        });
      }
    },
  );

  it("trusts upstream fallback eligibility without recalculating coverage or counts", () => {
    const input = candidates();
    const trend = fallback("rpe_adjusted");
    trend.earlier = { ...trend.earlier, observationCount: 1, rpeCoverage: 0 };
    input.early.adjustedFallback = trend;
    const result = selectStrengthTrend(input);
    expect(result.method).toBe("rpe_adjusted_fallback");
    if (result.method === "rpe_adjusted_fallback")
      expect(result.trend).toBe(trend);
  });

  it("returns Building History for missing candidates without altering unavailable reasons", () => {
    const input = candidates();
    const trend = fallback("rpe_adjusted", {
      change: unavailable("partial_rpe"),
      evidenceCap: null,
    });
    input.early.adjustedFallback = trend;
    expect(selectStrengthTrend(input)).toEqual({
      method: "building_history",
      family: "bench",
    });
    expect(trend.change).toEqual(unavailable("partial_rpe"));
  });

  it("returns Building History when no validated history for the selected lift exists", () => {
    for (const history of [
      [],
      workouts([exposure(2, { family: "squat" })], "squat"),
    ]) {
      const input = allCandidates();
      input.history = history;
      expect(selectStrengthTrend(input)).toEqual({
        method: "building_history",
        family: "bench",
      });
    }
  });

  it.each<LiftFamily>(["squat", "bench", "deadlift"])(
    "selects independently for %s and rejects other families' candidates",
    (family) => {
      const input = candidates();
      input.family = family;
      input.history = workouts([exposure(2, { family })], family);
      input.established.comparable = comparable({
        family: family === "bench" ? "squat" : "bench",
      });
      expect(selectStrengthTrend(input).method).toBe("building_history");
      input.early.rawFallback = fallback("raw_brzycki", { family });
      expect(selectStrengthTrend(input)).toMatchObject({
        method: "raw_brzycki_fallback",
        family,
      });
    },
  );
});

describe("established history", () => {
  it.each([
    { day: -1, mature: false },
    { day: 0, mature: true },
    { day: 6, mature: true },
    { day: 7, mature: false },
    { day: 18, mature: false },
    { day: 42, mature: false },
  ])(
    "checks local day $day against the oldest seven days",
    ({ day, mature }) => {
      expect(
        hasEstablishedLiftHistory(
          workouts([exposure(day)]),
          "bench",
          WINDOWS.established,
        ),
      ).toBe(mature);
    },
  );

  it("includes the last millisecond of day seven but excludes the following midnight", () => {
    const [workout] = workouts([exposure(2)]);
    const end = addLocalCalendarDays(WINDOWS.established.earlierStartsAt, 7);
    expect(
      hasEstablishedLiftHistory(
        [{ ...workout, finishedAt: end - 1 }],
        "bench",
        WINDOWS.established,
      ),
    ).toBe(true);
    expect(
      hasEstablishedLiftHistory(
        [{ ...workout, finishedAt: end }],
        "bench",
        WINDOWS.established,
      ),
    ).toBe(false);
  });

  it("uses workout completion rather than representative-set completion", () => {
    const [workout] = workouts([exposure(6)]);
    expect(
      hasEstablishedLiftHistory(
        [{ ...workout, finishedAt: startOfLocalDay(atDay(7)) }],
        "bench",
        WINDOWS.established,
      ),
    ).toBe(false);
  });

  it("requires the selected family but does not require the selected rep lane or RPE", () => {
    const history = workouts([exposure(2, { sets: [{ reps: 2, rpe: null }] })]);
    expect(
      hasEstablishedLiftHistory(history, "squat", WINDOWS.established),
    ).toBe(false);
    const input = candidates();
    input.history = history;
    input.established.comparable = comparable({ contributingReps: [5] });
    expect(selectStrengthTrend(input)).toMatchObject({
      method: "comparable",
      windowMode: "established",
    });
  });

  it("does not use another lift's old history to mature recent Bench history", () => {
    const input = allCandidates();
    input.history = [
      ...workouts([exposure(2, { family: "squat" })], "squat"),
      ...workouts([18, 25, 32, 40].map((day) => exposure(day))),
    ];
    expect(selectStrengthTrend(input)).toMatchObject({
      family: "bench",
      method: "comparable",
      windowMode: "early",
    });
  });

  it("ignores empty observations and invalid stored raw estimates", () => {
    const [workout] = workouts([exposure(2)]);
    expect(
      hasEstablishedLiftHistory(
        [{ ...workout, observations: [] }],
        "bench",
        WINDOWS.established,
      ),
    ).toBe(false);
    for (const rawEstimate of [0, -1, NaN, Infinity]) {
      const invalid = {
        ...workout,
        observations: workout.observations.map((observation) => ({
          ...observation,
          rawRepresentative: { ...observation.rawRepresentative, rawEstimate },
        })),
      };
      expect(
        hasEstablishedLiftHistory([invalid], "bench", WINDOWS.established),
      ).toBe(false);
    }
  });

  it("does not establish maturity from unfinished, warmup, excluded, variation or invalid sets", () => {
    const history = workouts([
      exposure(0, { sets: [{ type: "warmup" }] }),
      exposure(1, { sets: [{ rpe: 6 }] }),
      exposure(2, { sets: [{ finished: false }] }),
      exposure(3, { sets: [{ reps: 11 }] }),
      exposure(4, { sets: [{ weight: 0 }] }),
      exposure(5, { variation: true }),
      exposure(6, { active: true }),
    ]);
    expect(
      hasEstablishedLiftHistory(history, "bench", WINDOWS.established),
    ).toBe(false);
  });

  it.each(METHODS)(
    "applies maturity to %s in 42 days, while permitting its 28-day candidate",
    (method) => {
      const input = candidates();
      input.history = workouts(
        [18, 20, 25, 29, 33, 40].map((day) => exposure(day)),
      );
      setOnlyCandidate(input, method, "established");
      expect(selectStrengthTrend(input).method).toBe("building_history");
      setOnlyCandidate(input, method, "early");
      expect(selectStrengthTrend(input)).toMatchObject({
        method,
        windowMode: "early",
      });
    },
  );

  it.each([
    new Date(2026, 2, 24),
    new Date(2026, 9, 20),
    new Date(2026, 11, 29),
  ])(
    "uses seven local calendar days across DST and year boundaries from %s",
    (start) => {
      const window = createRepLaneWindow(
        addLocalCalendarDays(start.getTime(), 42),
        "established",
      );
      const [workout] = workouts([exposure(0)]);
      const end = addLocalCalendarDays(start.getTime(), 7);
      expect(
        hasEstablishedLiftHistory(
          [{ ...workout, finishedAt: end - 1 }],
          "bench",
          window,
        ),
      ).toBe(true);
      expect(
        hasEstablishedLiftHistory(
          [{ ...workout, finishedAt: end }],
          "bench",
          window,
        ),
      ).toBe(false);
    },
  );

  it("uses only the caller's selected segment after a training-gap reset", () => {
    const sessions = deriveLiftSessions(
      [0, 25, 30, 35, 40].map((day) => exposure(day)),
      "bench",
      atDay(41),
    );
    const history = selectComparisonHistory(
      sessions,
      atDay(41),
      progressConfig,
    );
    expect(history.gapReset).toBe(true);
    const input = candidates();
    input.established.comparable = comparable();
    input.history = history.contextDays
      .flatMap((day) => day.sessions)
      .map((session) => ({
        workoutId: session.workoutId,
        family: session.family,
        finishedAt: session.finishedAt,
        observations: deriveWorkoutRepObservations(session.strengthSets),
      }));
    expect(selectStrengthTrend(input).method).toBe("building_history");
    expect(
      hasEstablishedLiftHistory(
        workouts([exposure(0)]),
        "bench",
        WINDOWS.established,
      ),
    ).toBe(true);
  });
});

describe("window integrity and retained metadata", () => {
  it("rejects different analysis anchors", () => {
    const input = candidates();
    input.early.window = createRepLaneWindow(atDay(43), "early");
    expect(() => selectStrengthTrend(input)).toThrow(
      "Invalid strength-trend comparison windows",
    );
  });

  it.each(MODES)(
    "rejects malformed and incorrectly labelled %s windows",
    (mode) => {
      const invalidWindows = [
        { ...WINDOWS[mode], recentStartsAt: WINDOWS[mode].earlierStartsAt },
        { ...WINDOWS[mode], endExclusive: NaN },
        {
          ...WINDOWS[mode],
          earlierStartsAt: WINDOWS[mode].earlierStartsAt + 1,
        },
        WINDOWS[mode === "early" ? "established" : "early"],
        {
          ...WINDOWS[mode],
          recentStartsAt: addLocalCalendarDays(WINDOWS[mode].recentStartsAt, 1),
        },
      ];
      for (const window of invalidWindows) {
        const input = candidates();
        input[mode].window = window;
        expect(() => selectStrengthTrend(input)).toThrow();
      }
    },
  );

  it("validates the maturity helper's established window even with no history", () => {
    expect(() => hasEstablishedLiftHistory([], "bench", WINDOWS.early)).toThrow(
      "Invalid strength-trend comparison windows",
    );
    expect(() =>
      hasEstablishedLiftHistory([], "bench", {
        ...WINDOWS.established,
        endExclusive: Infinity,
      }),
    ).toThrow("Invalid rep-lane comparison window");
  });

  it.each(MODES)(
    "preserves original results, basis and evidence ceilings in %s mode",
    (mode) => {
      for (const method of METHODS) {
        const input = candidates();
        setOnlyCandidate(input, method, mode);
        const result = selectStrengthTrend(input);
        expect(result).toMatchObject({
          method,
          windowMode: mode,
          window: WINDOWS[mode],
        });
        if (result.method !== "building_history") {
          expect(result.trend.evidenceCap).toBe(
            method === "comparable" ? "strong" : "moderate",
          );
          expect(result).not.toHaveProperty("evidence");
          expect(result.trend).not.toHaveProperty("evidence");
        }
      }
    },
  );

  it("does not choose a later result to obtain a higher evidence ceiling", () => {
    const input = allCandidates();
    input.established.comparable = comparable({
      evidenceCap: "moderate",
      agreement: "major_conflict",
    });
    expect(selectStrengthTrend(input)).toMatchObject({
      method: "comparable",
      windowMode: "established",
      trend: { evidenceCap: "moderate", agreement: "major_conflict" },
    });
  });

  it("is repeatable, order independent and leaves frozen history, candidates and windows unchanged", () => {
    const input = allCandidates();
    input.history = workouts([
      exposure(2, { sets: [{ reps: 5 }, { reps: 2 }] }),
      exposure(20),
      exposure(38),
    ]);
    const snapshot = JSON.stringify(input);
    for (const workout of input.history) {
      for (const observation of workout.observations) {
        Object.freeze(observation.rawRepresentative);
        if (observation.adjustedRepresentative)
          Object.freeze(observation.adjustedRepresentative);
        Object.freeze(observation);
      }
      Object.freeze(workout.observations);
      Object.freeze(workout);
    }
    Object.freeze(input.history);
    for (const mode of MODES) {
      const bundle = input[mode];
      Object.freeze(bundle.window);
      for (const trend of [
        bundle.comparable,
        bundle.adjustedFallback,
        bundle.rawFallback,
      ]) {
        if (!trend) continue;
        Object.freeze(trend.change);
        if ("contributingReps" in trend) Object.freeze(trend.contributingReps);
        else {
          Object.freeze(trend.earlier);
          Object.freeze(trend.recent);
        }
        Object.freeze(trend);
      }
      Object.freeze(bundle);
    }
    Object.freeze(input);
    const expected = selectStrengthTrend(input);
    expect(selectStrengthTrend(input)).toEqual(expected);
    expect(
      selectStrengthTrend({
        ...input,
        history: [...input.history].reverse().map((workout) => ({
          ...workout,
          observations: [...workout.observations].reverse(),
        })),
      }),
    ).toEqual(expected);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("Steps 1–6 composition", () => {
  function precompute(
    history: readonly WorkoutRepObservations[],
    mode: RepLaneWindowMode,
  ): StrengthTrendWindowCandidates {
    const window = WINDOWS[mode];
    return {
      window,
      comparable: deriveOverallRepTrends(
        deriveRepLaneTrends(deriveDailyRepObservations(history), window),
      )[0],
      adjustedFallback: deriveFallbackStrengthTrends(
        history,
        window,
        "rpe_adjusted",
      )[0],
      rawFallback: deriveFallbackStrengthTrends(
        history,
        window,
        "raw_brzycki",
      )[0],
    };
  }

  it.each([
    {
      scenario: "comparable",
      earlierReps: [5, 5, 5],
      recentReps: [5, 5, 5],
      rpe: 8,
      expected: "comparable",
    },
    {
      scenario: "changing reps",
      earlierReps: [8, 6, 4],
      recentReps: [2, 3, 1],
      rpe: 8,
      expected: "rpe_adjusted_fallback",
    },
    {
      scenario: "missing RPE",
      earlierReps: [8, 6, 4],
      recentReps: [2, 3, 1],
      rpe: null,
      expected: "raw_brzycki_fallback",
    },
  ])(
    "selects real upstream results for $scenario",
    ({ earlierReps, recentReps, rpe, expected }) => {
      const history = workouts(
        [...earlierReps, ...recentReps].map((reps, index) =>
          exposure([2, 10, 17, 24, 31, 38][index], {
            sets: [{ reps, rpe, weight: index < 3 ? 100 : 105 }],
          }),
        ),
      );
      const input: StrengthTrendCandidates = {
        family: "bench",
        history,
        early: precompute(history, "early"),
        established: precompute(history, "established"),
      };
      expect(selectStrengthTrend(input)).toMatchObject({
        method: expected,
        windowMode: "established",
      });
    },
  );

  it("does not label mathematically available recent-only 42-day results as established", () => {
    const history = workouts(
      [18, 20, 25, 29, 33, 40].map((day) =>
        exposure(day, { sets: [{ weight: day < 21 ? 100 : 105 }] }),
      ),
    );
    const input: StrengthTrendCandidates = {
      family: "bench",
      history,
      early: precompute(history, "early"),
      established: precompute(history, "established"),
    };
    expect(input.established.comparable?.change.status).toBe("available");
    expect(input.early.comparable?.change.status).toBe("available");
    expect(selectStrengthTrend(input)).toMatchObject({
      method: "comparable",
      windowMode: "early",
    });
  });
});
