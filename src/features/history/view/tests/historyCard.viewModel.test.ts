import type { HistoryWorkoutSummary } from "@/domain/history/history.types";
import { createHistoryCardViewModel } from "../historyCard.viewModel";
import {
  formatHistoryPerformedAt,
  formatHistoryRelativeDay,
} from "../historyDate.utils";
import { millisecondsUntilLocalMidnight } from "@/shared/utils/localCalendar";

const startedAt = new Date(2026, 8, 5, 18, 30).getTime();
const summary: HistoryWorkoutSummary = {
  id: "workout_1",
  sourceTemplateId: null,
  startedAt,
  durationMinutes: 75,
  totalWeight: 8240,
  liftFamilies: ["bench", "squat", "deadlift"],
  exercises: [
    {
      id: "exercise_1",
      name: "Competition Bench",
      totalSets: 1,
      setCounts: { warmup: 0, working: 0, top: 1, backoff: 0 },
      topSet: { weight: 102.5, reps: 3 },
    },
  ],
};

it("formats ledger metrics, nonzero badges, and exact local start time", () => {
  expect(
    createHistoryCardViewModel(summary, new Date(2026, 8, 7).getTime()),
  ).toEqual({
    workoutName: "Quick Workout",
    duration: "75 min",
    liftBadges: [
      { family: "bench", label: "Bench" },
      { family: "squat", label: "Squat" },
      { family: "deadlift", label: "Deadlift" },
    ],
    exercises: [
      {
        id: "exercise_1",
        name: "Competition Bench",
        totalSets: "1 set",
        topSet: "Top: 102.5 kg × 3",
        setBadges: [{ type: "top", label: "Top 1" }],
      },
    ],
    relativeDay: "2 days ago",
    totalWeight: "8,240 kg total",
    performedAt: "Performed Sep 5, 2026 · 18:30",
  });
});

it("preserves template naming and formats zero weight without a placeholder", () => {
  const card = createHistoryCardViewModel(
    {
      ...summary,
      sourceTemplateId: "template_1",
      totalWeight: 0,
      exercises: [{ ...summary.exercises[0], topSet: { weight: 0, reps: 10 } }],
    },
    startedAt,
  );
  expect(card.workoutName).toBe("Template Workout");
  expect(card.totalWeight).toBe("0 kg total");
  expect(card.exercises[0].topSet).toBe("Top: 0 kg × 10");
});

it("uses calendar days across midnight, month/year boundaries, and daylight-saving transitions", () => {
  for (const [start, current, label] of [
    [new Date(2026, 8, 5, 0), new Date(2026, 8, 5, 23, 59), "Today"],
    [new Date(2026, 8, 5, 23, 59), new Date(2026, 8, 6, 0, 1), "Yesterday"],
    [new Date(2025, 11, 31, 23), new Date(2026, 0, 1, 0), "Yesterday"],
    [new Date(2026, 2, 28, 23), new Date(2026, 2, 30, 0), "2 days ago"],
    [new Date(2026, 9, 24, 23), new Date(2026, 9, 26, 0), "2 days ago"],
  ] as const) {
    expect(formatHistoryRelativeDay(start.getTime(), current.getTime())).toBe(
      label,
    );
  }
});

it("formats local midnight as 00:00", () => {
  expect(formatHistoryPerformedAt(new Date(2026, 8, 5).getTime())).toBe(
    "Performed Sep 5, 2026 · 00:00",
  );
});

it("schedules local midnight correctly on daylight-saving days", () => {
  for (const date of [new Date(2026, 2, 29), new Date(2026, 9, 25)]) {
    const nextMidnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );
    expect(millisecondsUntilLocalMidnight(date.getTime())).toBe(
      nextMidnight.getTime() - date.getTime(),
    );
  }
  expect(
    millisecondsUntilLocalMidnight(new Date(2026, 8, 5, 23, 59, 59).getTime()),
  ).toBe(1000);
});
