import { localCalendarDay } from "@/shared/utils/localCalendar";

import type { RepLaneWindowMode } from "../progress.repLaneTrends.types";
import { createRepLaneWindow } from "../progress.repLaneWindow";

it.each<{ mode: RepLaneWindowMode; halfDays: number }>([
  { mode: "early", halfDays: 14 },
  { mode: "established", halfDays: 21 },
])(
  "creates two equal $halfDays-day halves for $mode mode",
  ({ mode, halfDays }) => {
    const endExclusive = new Date(2026, 8, 30).getTime();
    const window = createRepLaneWindow(endExclusive, mode);

    expect(window.endExclusive).toBe(endExclusive);
    expect(
      localCalendarDay(window.recentStartsAt) -
        localCalendarDay(window.earlierStartsAt),
    ).toBe(halfDays);
    expect(
      localCalendarDay(window.endExclusive) -
        localCalendarDay(window.recentStartsAt),
    ).toBe(halfDays);
    expect(window.earlierStartsAt).toBeLessThan(window.recentStartsAt);
    expect(window.recentStartsAt).toBeLessThan(window.endExclusive);
  },
);

it("normalizes both modes to the supplied end's local midnight without advancing it", () => {
  const anchor = new Date(2026, 8, 30, 18, 45).getTime();
  const midnight = new Date(2026, 8, 30).getTime();

  expect(createRepLaneWindow(anchor, "early").endExclusive).toBe(midnight);
  expect(createRepLaneWindow(anchor, "established").endExclusive).toBe(
    midnight,
  );
});

it.each<{
  mode: RepLaneWindowMode;
  end: Date;
  earlier: Date;
  recent: Date;
}>([
  {
    mode: "early",
    end: new Date(2026, 4, 5),
    earlier: new Date(2026, 3, 7),
    recent: new Date(2026, 3, 21),
  },
  {
    mode: "established",
    end: new Date(2026, 4, 5),
    earlier: new Date(2026, 2, 24),
    recent: new Date(2026, 3, 14),
  },
  {
    mode: "early",
    end: new Date(2027, 0, 12),
    earlier: new Date(2026, 11, 15),
    recent: new Date(2026, 11, 29),
  },
  {
    mode: "established",
    end: new Date(2027, 0, 12),
    earlier: new Date(2026, 11, 1),
    recent: new Date(2026, 11, 22),
  },
  {
    mode: "early",
    end: new Date(2026, 2, 30),
    earlier: new Date(2026, 2, 2),
    recent: new Date(2026, 2, 16),
  },
  {
    mode: "established",
    end: new Date(2026, 2, 30),
    earlier: new Date(2026, 1, 16),
    recent: new Date(2026, 2, 9),
  },
  {
    mode: "early",
    end: new Date(2026, 9, 26),
    earlier: new Date(2026, 8, 28),
    recent: new Date(2026, 9, 12),
  },
  {
    mode: "established",
    end: new Date(2026, 9, 26),
    earlier: new Date(2026, 8, 14),
    recent: new Date(2026, 9, 5),
  },
])(
  "preserves local-midnight dates across month/year/DST boundaries: $mode ending $end",
  ({ mode, end, earlier, recent }) => {
    expect(createRepLaneWindow(end.getTime(), mode)).toEqual({
      earlierStartsAt: earlier.getTime(),
      recentStartsAt: recent.getTime(),
      endExclusive: end.getTime(),
    });
  },
);

it.each([NaN, Infinity, -Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER])(
  "rejects an invalid analysis end %s",
  (endExclusive) => {
    expect(() => createRepLaneWindow(endExclusive, "early")).toThrow(
      "Invalid rep-lane analysis end",
    );
  },
);

it("creates independent window objects for repeated calls and different modes", () => {
  const endExclusive = new Date(2026, 8, 30).getTime();
  const early = createRepLaneWindow(endExclusive, "early");
  const established = createRepLaneWindow(endExclusive, "established");
  early.recentStartsAt = early.earlierStartsAt;

  expect(createRepLaneWindow(endExclusive, "early").recentStartsAt).toBe(
    new Date(2026, 8, 16).getTime(),
  );
  expect(established.recentStartsAt).toBe(new Date(2026, 8, 9).getTime());
});
