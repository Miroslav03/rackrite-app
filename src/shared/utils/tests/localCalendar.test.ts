import {
  addLocalCalendarDays,
  localCalendarDay,
  startOfLocalWeek,
  millisecondsUntilLocalMidnight,
} from "../localCalendar";

it.each([
  [2026, 0, 5, 2026, 0, 5],
  [2026, 0, 11, 2026, 0, 5],
  [2026, 0, 1, 2025, 11, 29],
])("groups %i-%i-%i into its local Monday", (y, m, d, wy, wm, wd) => {
  expect(startOfLocalWeek(new Date(y, m, d, 22).getTime())).toBe(
    new Date(wy, wm, wd).getTime(),
  );
});

it.each([
  [2026, 2, 28],
  [2026, 9, 24],
  [2026, 11, 31],
])(
  "shifts calendar days preserving wall time at seasonal/year boundaries",
  (y, m, d) => {
    const start = new Date(y, m, d, 12).getTime();
    const shifted = addLocalCalendarDays(start, 1);

    expect(new Date(shifted).getHours()).toBe(12);
    expect(localCalendarDay(shifted) - localCalendarDay(start)).toBe(1);
    expect(addLocalCalendarDays(shifted, -1)).toBe(start);
  },
);

it("schedules the next midnight and respects local timezone interpretation", () => {
  const start = new Date(2026, 8, 7, 23, 59, 59, 500).getTime();

  expect(millisecondsUntilLocalMidnight(start)).toBe(500);
  expect(startOfLocalWeek(start)).toBe(new Date(2026, 8, 7).getTime());
});
