import {
  addLocalCalendarDays,
  startOfLocalDay,
  validTimestamp,
} from "@/shared/utils/localCalendar";

import type {
  RepLaneWindow,
  RepLaneWindowMode,
} from "./progress.repLaneTrends.types";

export function assertRepLaneWindow(window: RepLaneWindow): void {
  const boundaries = [
    window.earlierStartsAt,
    window.recentStartsAt,
    window.endExclusive,
  ];

  if (
    !boundaries.every(
      (boundary) =>
        validTimestamp(boundary) && startOfLocalDay(boundary) === boundary,
    ) ||
    window.earlierStartsAt >= window.recentStartsAt ||
    window.recentStartsAt >= window.endExclusive
  ) {
    throw new Error("Invalid rep-lane comparison window");
  }
}

/** Uses the supplied end's local midnight without advancing the analysis anchor. */
export function createRepLaneWindow(
  endExclusive: number,
  mode: RepLaneWindowMode,
): RepLaneWindow {
  if (!validTimestamp(endExclusive)) {
    throw new Error("Invalid rep-lane analysis end");
  }

  const end = startOfLocalDay(endExclusive);
  const halfDays = mode === "early" ? 14 : 21;

  const window = {
    earlierStartsAt: addLocalCalendarDays(end, -2 * halfDays),
    recentStartsAt: addLocalCalendarDays(end, -halfDays),
    endExclusive: end,
  };

  assertRepLaneWindow(window);
  return window;
}
