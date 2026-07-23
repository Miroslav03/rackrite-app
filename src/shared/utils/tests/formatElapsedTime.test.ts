import { formatElapsedTime } from "../formatElapsedTime";

describe("formatElapsedTime", () => {
  it.each([
    [0, "0:00"],
    [10_000, "0:10"],
    [1_930_000, "32:10"],
    [3_600_000, "1:00:00"],
    [5_502_000, "1:31:42"],
  ])("formats %i milliseconds as %s", (elapsedMilliseconds, expected) => {
    expect(formatElapsedTime(elapsedMilliseconds)).toBe(expected);
  });

  it("clamps a negative elapsed duration to zero", () => {
    expect(formatElapsedTime(-1_000)).toBe("0:00");
  });
});
