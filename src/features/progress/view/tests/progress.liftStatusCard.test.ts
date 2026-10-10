import { createElement } from "react";

import { analyzeCompetitionLifts } from "@/domain/progress/analysis/progress.useCases";
import { atDay, exposure } from "@/domain/progress/tests/progress.test.helpers";

import { LiftStatusCard } from "../components/LiftStatusCard";
import { createProgressViewModel } from "../progress.viewModel";
import {
  act,
  button,
  buttons,
  cardModel,
  dispose,
  press,
  renderCard,
  visibleText,
} from "./progress.cards.test.helpers";

it.each([
  { name: "empty history", history: [] },
  {
    name: "sessions without eligible strength sets",
    history: [exposure(60, { sets: [{ rpe: 6 }] })],
  },
])(
  "keeps lift identity and explains unavailable measurements for $name",
  async ({ history }) => {
    const model = createProgressViewModel(
      analyzeCompetitionLifts(history, atDay(60)),
      "bench",
    ).status;
    const renderer = await renderCard(createElement(LiftStatusCard, { model }));

    try {
      expect(visibleText(renderer.root)).toEqual([
        "STRENGTH NOW",
        "LEARNING",
        "BENCH PRESS",
        model.summary,
      ]);
      expect(buttons(renderer.root)).toHaveLength(0);
    } finally {
      await dispose(renderer);
    }
  },
);

it.each([
  { day: 60, note: "Based on limited history" },
  { day: 35, note: "Estimate may be stale" },
])(
  "reveals the estimate qualification from its header icon: $note",
  async ({ day, note }) => {
    const model = createProgressViewModel(
      analyzeCompetitionLifts([exposure(day)], atDay(60)),
      "bench",
    ).status;
    const renderer = await renderCard(createElement(LiftStatusCard, { model }));

    try {
      const text = visibleText(renderer.root);
      expect(text).toEqual(
        expect.arrayContaining([
          "BENCH PRESS",
          "LEARNING",
          "Estimated max",
          "120",
          model.summary,
        ]),
      );
      expect(text).not.toContain(model.performanceLabel);
      expect(text).not.toContain(model.basis);
      expect(text).not.toContain("Not enough data");
      expect(text).not.toContain("No estimate yet");
      expect(text).not.toContain("More history needed for comparison");
      expect(text).not.toContain(note);
      expect(
        button(renderer.root, "About this estimated max").props
          .accessibilityState,
      ).toEqual({ expanded: false });
      await press(button(renderer.root, "About this estimated max"));
      expect(visibleText(renderer.root)).toContain(note);
      expect(
        button(renderer.root, "About this estimated max").props
          .accessibilityState,
      ).toEqual({ expanded: true });
      await press(button(renderer.root, "About this estimated max"));
      expect(visibleText(renderer.root)).not.toContain(note);
    } finally {
      await dispose(renderer);
    }
  },
);

it("keeps a measured zero change and its comparison context", async () => {
  const model = cardModel().status;
  const renderer = await renderCard(createElement(LiftStatusCard, { model }));

  try {
    expect(visibleText(renderer.root)).toEqual(
      expect.arrayContaining(["0%", model.basis, "Estimated max", "120"]),
    );
    expect(buttons(renderer.root)).toHaveLength(0);
  } finally {
    await dispose(renderer);
  }
});

it("hides an expanded qualification when the note or available estimate changes", async () => {
  const model = cardModel().status;
  const renderer = await renderCard(
    createElement(LiftStatusCard, {
      model: { ...model, estimateNote: "Based on limited history" },
    }),
  );
  try {
    await press(button(renderer.root, "About this estimated max"));
    expect(visibleText(renderer.root)).toContain("Based on limited history");
    await act(async () => {
      renderer.update(
        createElement(LiftStatusCard, {
          model: { ...model, estimateNote: "Estimate may be stale" },
        }),
      );
    });
    expect(visibleText(renderer.root)).not.toContain(
      "Based on limited history",
    );
    expect(visibleText(renderer.root)).not.toContain("Estimate may be stale");
    await press(button(renderer.root, "About this estimated max"));
    expect(visibleText(renderer.root)).toContain("Estimate may be stale");
    await act(async () => {
      renderer.update(
        createElement(LiftStatusCard, {
          model: {
            ...model,
            estimatedMax: null,
            estimateNote: "Estimate may be stale",
          },
        }),
      );
    });
    expect(visibleText(renderer.root)).not.toContain("Estimate may be stale");
    expect(buttons(renderer.root)).toHaveLength(0);
  } finally {
    await dispose(renderer);
  }
});

it("shows an available comparison without an empty estimate section", async () => {
  const model = cardModel({
    currentEstimatedMax: { status: "unavailable", reason: "no_performance" },
  }).status;
  const renderer = await renderCard(createElement(LiftStatusCard, { model }));

  try {
    const text = visibleText(renderer.root);
    expect(text).toContain("0%");
    expect(text).toContain(model.basis);
    expect(text).not.toContain("Estimated max");
    expect(text).not.toContain("No estimate yet");
    expect(text).not.toContain("No change vs baseline");
  } finally {
    await dispose(renderer);
  }
});
