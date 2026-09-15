import { deriveLiftSessions } from "../../sessions/progress.sessions";
import {
  comparePerformance,
  deriveDailyPerformance,
} from "../progress.trends.utils";
import { deriveLiftTrends } from "../progress.trends";
import { atDay, exposure, series } from "../../tests/progress.test.helpers";

it("keeps one daily signal for multiple completed workouts", () => {
  const history = [exposure(0), exposure(0, { id: "evening" })];
  const trends = deriveLiftTrends(
    deriveLiftSessions(history, "bench", atDay(1)),
    atDay(1),
  );

  expect(trends.days).toHaveLength(1);
  expect(trends.days[0].sessions).toHaveLength(2);
  expect(trends.weekly.at(-1)?.volume).toBe(1000);
});

it("never fills an adjusted series with raw estimates", () => {
  const history = series(
    Array(16).fill(100),
    Array.from({ length: 16 }, (_, i) => (i % 2 ? 8 : null)),
  );
  const trends = deriveLiftTrends(
    deriveLiftSessions(history, "bench", atDay(60)),
    atDay(60),
  );

  expect(trends.basis).toBe("load_reps");
  expect(trends.days.some((day) => day.adjusted === null)).toBe(true);
  expect(trends.rpeChange).toMatchObject({
    status: "unavailable",
    reason: "partial_rpe",
  });
});

it("marks the current week partial and keeps unknown weeks empty", () => {
  const trends = deriveLiftTrends(
    deriveLiftSessions([exposure(0)], "bench", atDay(1)),
    atDay(1),
  );

  expect(trends.weekly).toHaveLength(8);
  expect(trends.weekly[0].volume).toBeNull();
  expect(trends.weekly.at(-1)).toMatchObject({ partial: true, volume: 500 });
  expect(trends.volumeChange).toMatchObject({
    status: "unavailable",
    reason: "incomplete_period",
  });
});

it("compares calendar halves with an inclusive start and exclusive end", () => {
  const history = [-1, 0, 7, 20, 21, 28, 41, 42].map((day) =>
    exposure(day, {
      sets: [{ weight: day < 21 ? 100 : 110, reps: 1, rpe: null }],
    }),
  );
  const days = deriveDailyPerformance(
    deriveLiftSessions(history, "bench", atDay(43)),
  );

  expect(comparePerformance(days, atDay(42), "load_reps")).toEqual({
    window: { from: atDay(0), through: atDay(42) - 1 },
    baseline: 100,
    recent: 110,
    baselineDays: 3,
    recentDays: 3,
    change: { status: "available", value: expect.closeTo(10) },
  });
});

it("requires three usable days in each half even when the total sample is large", () => {
  const history = [0, 7, 21, 28, 35, 41].map((day) => exposure(day));
  const days = deriveDailyPerformance(
    deriveLiftSessions(history, "bench", atDay(43)),
  );

  expect(comparePerformance(days, atDay(42), "load_reps")).toMatchObject({
    baselineDays: 2,
    recentDays: 4,
    change: { status: "unavailable", reason: "insufficient_history" },
  });
});

it.each([21, 22])(
  "resets the current segment only for gaps over 21 days (gap %i)",
  (gap) => {
    const sessions = deriveLiftSessions(
      [exposure(0), exposure(gap)],
      "bench",
      atDay(gap + 1),
    );
    const trends = deriveLiftTrends(sessions, atDay(gap + 1));

    expect(trends.gapReset).toBe(gap > 21);
    expect(trends.contextDays).toHaveLength(gap > 21 ? 1 : 2);
  },
);

it("leaves session input unchanged and retains daily source references", () => {
  const sessions = deriveLiftSessions(
    series([100, 102, 104, 106]),
    "bench",
    atDay(20),
  );
  const original = JSON.parse(JSON.stringify(sessions));
  const first = deriveLiftTrends(sessions, atDay(20));

  expect(deriveLiftTrends(sessions, atDay(20))).toEqual(first);
  expect(sessions).toEqual(original);
  expect(first.days[0].sessions[0]).toBe(sessions[0]);
});
