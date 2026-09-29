import type { HistoryWorkoutSummary } from "@/domain/history/history.types";

import { createHistoryCardViewModel } from "../historyCard.viewModel";

it("keeps the best set and set-type badges without family badges or set totals", () => {
  const summary: HistoryWorkoutSummary = {
    id: "workout",
    sourceTemplateId: null,
    description: null,
    startedAt: 0,
    durationMinutes: 45,
    totalWeight: 500,
    exercises: [
      {
        id: "bench",
        name: "Competition Bench",
        topSet: { weight: 100, reps: 5 },
        setCounts: { warmup: 1, working: 2, top: 1, backoff: 0 },
      },
    ],
  };

  const card = createHistoryCardViewModel(summary);
  expect(card.exercises).toEqual([
    {
      id: "bench",
      name: "Competition Bench",
      topSet: "Top: 100 kg × 5",
      setBadges: [
        { type: "warmup", label: "Warm-up" },
        { type: "working", label: "Working" },
        { type: "top", label: "Top" },
      ],
    },
  ]);
  expect(card).not.toHaveProperty("liftBadges");
  expect(card.duration).toBe("45 min");
  expect(card.totalWeight).toBe("VOLUME: 500 kg");
});
