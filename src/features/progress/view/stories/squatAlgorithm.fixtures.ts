import {
  buildAlgorithmScenario,
  type AlgorithmTrainingWeek,
} from "./algorithmScenario.fixtures";

// Scenario 1 — Steady squat progression — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 225 | 8
// 1 | Heavy | 3 | 4 | 200 | 7, 7, 8
// 1 | Volume | 4 | 5 | 190 | 7, 7, 8, 8
// 2 | Heavy | 1 | 1 | 225 | 8
// 2 | Heavy | 3 | 4 | 200 | 7, 7, 8
// 2 | Volume | 4 | 5 | 190 | 7, 7, 8, 8
// 3 | Heavy | 1 | 1 | 227.5 | 8
// 3 | Heavy | 3 | 4 | 202.5 | 7, 7, 8
// 3 | Volume | 4 | 5 | 192.5 | 7, 7, 8, 8
// 4 | Heavy | 1 | 1 | 227.5 | 8
// 4 | Heavy | 3 | 4 | 202.5 | 7, 7, 8
// 4 | Volume | 4 | 5 | 192.5 | 7, 7, 8, 8
// 5 | Heavy | 1 | 1 | 230 | 8
// 5 | Heavy | 3 | 4 | 205 | 7, 7, 8
// 5 | Volume | 4 | 5 | 195 | 7, 7, 8, 8
// 6 | Heavy | 1 | 1 | 230 | 8
// 6 | Heavy | 3 | 4 | 205 | 7, 7, 8
// 6 | Volume | 4 | 5 | 195 | 7, 7, 8, 8
// 7 | Heavy | 1 | 1 | 232.5 | 8
// 7 | Heavy | 3 | 4 | 207.5 | 7, 7, 8
// 7 | Volume | 4 | 5 | 197.5 | 7, 7, 8, 8
// 8 | Heavy | 1 | 1 | 232.5 | 8
// 8 | Heavy | 3 | 4 | 207.5 | 7, 7, 8
// 8 | Volume | 4 | 5 | 197.5 | 7, 7, 8, 8
// Synthetic training data; research rationale is in squat-algorithm-results.md.
// Preserve source RPE here; only recorded history floors fractional values.
export const steadySquatWeeks: readonly AlgorithmTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 225, reps: 1, rpes: [8] },
        { weight: 200, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 190, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 225, reps: 1, rpes: [8] },
        { weight: 200, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 190, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 227.5, reps: 1, rpes: [8] },
        { weight: 202.5, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 192.5, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 227.5, reps: 1, rpes: [8] },
        { weight: 202.5, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 192.5, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 230, reps: 1, rpes: [8] },
        { weight: 205, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 195, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 230, reps: 1, rpes: [8] },
        { weight: 205, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 195, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 232.5, reps: 1, rpes: [8] },
        { weight: 207.5, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 197.5, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 232.5, reps: 1, rpes: [8] },
        { weight: 207.5, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 197.5, reps: 5, rpes: [7, 7.5, 8, 8] }],
    },
  ],
];

export const steadySquatScenario = buildAlgorithmScenario({
  number: 1,
  title: "Steady squat progression — 2×/week",
  intent:
    "Eight weeks of competition squat: Monday single at RPE 8 plus 3×4 backoffs; Thursday 4×5 volume. Loads rise by 2.5 kg every two weeks at similar effort. Heavy singles exceed 220 kg; backoffs and volume stay lighter.",
  liftFamily: "squat",
  workoutIdPrefix: "squat_scenario_1",
  weeks: steadySquatWeeks,
});

export const steadySquatHistory = steadySquatScenario.history;
export const steadySquatCheckpoints = steadySquatScenario.checkpoints;
