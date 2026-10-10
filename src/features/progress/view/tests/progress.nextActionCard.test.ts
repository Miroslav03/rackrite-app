import { createElement } from "react";

import { NextActionCard } from "../components/NextActionCard";
import {
  act,
  baseAnalysis,
  benchmark,
  button,
  buttons,
  cardModel,
  dispose,
  press,
  renderCard,
  visibleText,
} from "./progress.cards.test.helpers";

it("toggles the unavailable benchmark explanation from its header icon", async () => {
  const model = { ...cardModel().action, benchmark: null };
  const renderer = await renderCard(createElement(NextActionCard, { model }));
  try {
    expect(visibleText(renderer.root)).not.toContain(model.unavailable);
    expect(
      button(renderer.root, "Why this benchmark is unavailable").props
        .accessibilityState,
    ).toEqual({ expanded: false });
    await press(button(renderer.root, "Why this benchmark is unavailable"));
    expect(visibleText(renderer.root)).toContain(model.unavailable);
    expect(
      button(renderer.root, "Why this benchmark is unavailable").props
        .accessibilityState,
    ).toEqual({ expanded: true });
    await press(button(renderer.root, "Why this benchmark is unavailable"));
    expect(visibleText(renderer.root)).not.toContain(model.unavailable);
  } finally {
    await dispose(renderer);
  }
});

it("closes a changed explanation and removes the icon when a benchmark is available", async () => {
  const model = { ...cardModel().action, benchmark: null };
  const renderer = await renderCard(createElement(NextActionCard, { model }));
  try {
    await press(button(renderer.root, "Why this benchmark is unavailable"));
    const unavailable =
      "These results are outdated. Refresh successfully to see a benchmark.";
    await act(async () => {
      renderer.update(
        createElement(NextActionCard, { model: { ...model, unavailable } }),
      );
    });
    expect(visibleText(renderer.root)).not.toContain(model.unavailable);
    expect(visibleText(renderer.root)).not.toContain(unavailable);
    await press(button(renderer.root, "Why this benchmark is unavailable"));
    expect(visibleText(renderer.root)).toContain(unavailable);
    await act(async () => {
      renderer.update(
        createElement(NextActionCard, {
          model: cardModel({
            recommendation: {
              ...baseAnalysis.recommendation,
              benchmark: benchmark(),
              benchmarkUnavailableReason: null,
            },
          }).action,
        }),
      );
    });
    expect(buttons(renderer.root)).toHaveLength(0);
    expect(visibleText(renderer.root)).not.toContain(unavailable);
  } finally {
    await dispose(renderer);
  }
});
