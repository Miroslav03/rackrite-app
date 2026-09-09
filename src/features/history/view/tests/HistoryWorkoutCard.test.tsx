import { createElement, type ReactElement } from "react";
import { Text } from "react-native";

import type { HistoryWorkoutSummary } from "@/domain/history/history.types";
import { HistoryWorkoutCard } from "../components/HistoryWorkoutCard";

type Renderer = {
  root: {
    findAllByType: (type: unknown) => { props: { children?: unknown } }[];
  };
  update: (element: ReactElement) => void;
  unmount: () => void;
};
const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => Renderer;
}>("react-test-renderer");

it("renders a read-only ledger and updates its relative date with the same workout reference", async () => {
  const startedAt = new Date(2026, 8, 5, 18, 30).getTime();
  const workout: HistoryWorkoutSummary = {
    id: "workout_1",
    sourceTemplateId: null,
    startedAt,
    durationMinutes: 75,
    totalWeight: 1025,
    liftFamilies: ["bench"],
    exercises: [
      {
        id: "exercise_1",
        name: "Competition Bench",
        totalSets: 2,
        topSet: { weight: 102.5, reps: 5 },
        setCounts: { working: 1, top: 1, warmup: 0, backoff: 0 },
      },
    ],
  };
  const rendererRef: { current?: Renderer } = {};
  await act(async () => {
    rendererRef.current = create(
      createElement(HistoryWorkoutCard, { workout, dateReference: startedAt }),
    );
  });
  const renderer = rendererRef.current;
  if (!renderer) throw new Error("Card not rendered");
  try {
    const labels = () =>
      renderer.root.findAllByType(Text).map(({ props }) => props.children);
    expect(labels()).toEqual(
      expect.arrayContaining([
        "Quick Workout",
        "75 min",
        "BENCH",
        "Competition Bench",
        "Top: 102.5 kg × 5",
        "2 sets",
        "Working 1",
        "Top 1",
        "Today",
        "1,025 kg total",
        "Performed Sep 5, 2026 · 18:30",
      ]),
    );
    expect(labels()).not.toContain("Warm-up 0");
    await act(async () => {
      renderer.update(
        createElement(HistoryWorkoutCard, {
          workout,
          dateReference: new Date(2026, 8, 6).getTime(),
        }),
      );
    });
    expect(labels()).toContain("Yesterday");
    expect(labels()).not.toContain("Today");
  } finally {
    await act(async () => {
      renderer.unmount();
    });
  }
});
