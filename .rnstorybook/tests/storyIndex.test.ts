import type { StoryIndex } from "storybook/internal/types";

import { applyExplicitStoryIds } from "../storyIndex";

const benchTitle = "Progress/Algorithm scenarios/Bench/Scenario 1";
const nativeId = "progress-algorithm-scenarios-bench-scenario-1--week-1-heavy";
const stableId = "progress-algorithm-scenarios-scenario-1--week-1-heavy";
const squatId = "progress-algorithm-scenarios-squat-scenario-1--week-8-volume";

const index: StoryIndex = {
  v: 5,
  entries: {
    [nativeId]: {
      type: "story",
      subtype: "story",
      id: nativeId,
      name: "Week 1 · Heavy",
      title: benchTitle,
      importPath: "./BenchAlgorithm.stories.tsx",
      tags: ["story"],
    },
    [squatId]: {
      type: "story",
      subtype: "story",
      id: squatId,
      name: "Week 8 · Volume",
      title: "Progress/Algorithm scenarios/Squat/Scenario 1",
      importPath: "./SquatAlgorithm.stories.tsx",
      tags: ["story"],
    },
  },
};
const modules = [
  {
    default: {
      title: benchTitle,
      id: "progress-algorithm-scenarios-scenario-1",
    },
  },
  { default: { title: "Progress/Algorithm scenarios/Squat/Scenario 1" } },
];

it("keeps explicit CSF IDs while retaining the new sidebar title", () => {
  const corrected = applyExplicitStoryIds(index, modules);
  expect(Object.keys(corrected.entries)).toEqual([stableId, squatId]);
  expect(corrected.entries[stableId]).toEqual({
    ...index.entries[nativeId],
    id: stableId,
  });
  expect(corrected.entries[stableId].title).toBe(benchTitle);
  expect(corrected.entries[squatId]).toBe(index.entries[squatId]);
  expect(Object.keys(index.entries)).toEqual([nativeId, squatId]);
});

it("is safe to reapply after native Storybook regenerates its index during hot reload", () => {
  const corrected = applyExplicitStoryIds(index, modules);
  expect(applyExplicitStoryIds(corrected, modules)).toEqual(corrected);
  expect(applyExplicitStoryIds(index, modules)).toEqual(corrected);
});

it("leaves stories without explicit metadata IDs unchanged and ignores unrelated module exports", () => {
  expect(
    applyExplicitStoryIds(index, [
      null,
      undefined,
      0,
      "value",
      {},
      { default: null },
      { default: { title: benchTitle, id: 123 } },
    ]),
  ).toEqual(index);
});
