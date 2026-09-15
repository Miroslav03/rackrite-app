import {
  estimateOneRepMax,
  estimateEffortAdjustedPerformance,
  estimateLoadForEffort,
} from "../progress.performance";
import { percentChange } from "../../measurements/progress.measurements";

it("anchors a maximal single and normalizes low-repetition work", () => {
  expect(estimateOneRepMax(100, 1)).toBe(100);
  expect(estimateOneRepMax(100, 5)).toBe(112.5);
  expect(estimateOneRepMax(102.5, 5)).toBeGreaterThan(112.5);
});

it.each([
  [0, 5],
  [-1, 5],
  [NaN, 5],
  [Infinity, 5],
  [100, 0],
  [100, 11],
  [100, 1.5],
])("withholds unsupported estimates for %s x %s", (weight, reps) =>
  expect(estimateOneRepMax(weight, reps)).toBeNull(),
);

it("recognizes decreasing effort without altering raw strength", () => {
  expect(estimateEffortAdjustedPerformance(100, 5, 7)).toBeGreaterThan(
    estimateEffortAdjustedPerformance(100, 5, 8) ?? Infinity,
  );
  expect(estimateEffortAdjustedPerformance(100, 5, 9)).toBeLessThan(
    estimateEffortAdjustedPerformance(100, 5, 8) ?? 0,
  );
});

it.each([null, 6, 7.5, 11, NaN])(
  "does not invent adjusted performance at RPE %s",
  (rpe) => expect(estimateEffortAdjustedPerformance(100, 5, rpe)).toBeNull(),
);

it("does not clamp effective repetitions and inverts the same formula", () => {
  expect(estimateEffortAdjustedPerformance(100, 9, 7)).toBeNull();

  const capacity = estimateEffortAdjustedPerformance(100, 3, 8);

  expect(capacity).not.toBeNull();
  expect(estimateLoadForEffort(capacity ?? 0, 3, 8)).toBeCloseTo(100);
  expect(percentChange(0, 100).status).toBe("unavailable");
});
