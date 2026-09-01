import { formatCountdownTime } from "../formatCountdownTime";

describe("formatCountdownTime", () => {
  it.each([
    [180_000, "3:00"],
    [179_999, "3:00"],
    [179_000, "2:59"],
    [1_001, "0:02"],
    [1_000, "0:01"],
    [1, "0:01"],
    [0, "0:00"],
    [-1_000, "0:00"],
  ])("formats %i remaining milliseconds as %s", (remaining, expected) => {
    expect(formatCountdownTime(remaining)).toBe(expected);
  });
});
