import { getWorkoutDurationMinutes } from "../workout.utils";

describe("workout duration in minutes", () => {
  it.each([
    [0, 0],
    [59_999, 0],
    [60_000, 1],
    [90_000, 1],
    [4_500_000, 75],
    [-1, 0],
  ])("converts %i elapsed milliseconds to %i minutes", (elapsed, minutes) => {
    expect(getWorkoutDurationMinutes(1000, 1000 + elapsed)).toBe(minutes);
  });
});
