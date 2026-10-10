import {
  buildAlgorithmScenario,
  type AlgorithmCheckpoint,
  type AlgorithmScenario,
  type AlgorithmTrainingWeek,
} from "./algorithmScenario.fixtures";

type BenchWeek = {
  single: readonly [weight: number, rpe: number];
  backoffWeight: number;
  backoffRpes: readonly number[];
  volumeWeight: number;
  volumeRpes: readonly number[];
};

// Scenario 1 — Steady progression — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 105 | 8
// 1 | Heavy | 4 | 4 | 92.5 | 7, 7, 7, 8
// 1 | Volume | 4 | 6 | 85 | 7, 7, 7, 8
// 2 | Heavy | 1 | 1 | 105 | 7
// 2 | Heavy | 4 | 4 | 92.5 | 6, 7, 7, 7
// 2 | Volume | 4 | 6 | 85 | 6, 7, 7, 7
// 3 | Heavy | 1 | 1 | 107.5 | 8
// 3 | Heavy | 4 | 4 | 95 | 7, 7, 8, 8
// 3 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 4 | Heavy | 1 | 1 | 107.5 | 7
// 4 | Heavy | 4 | 4 | 95 | 7, 7, 8, 8
// 4 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 5 | Heavy | 1 | 1 | 110 | 8
// 5 | Heavy | 4 | 4 | 97.5 | 7, 7, 8, 8
// 5 | Volume | 4 | 6 | 90 | 7, 7, 8, 8
// 6 | Heavy | 1 | 1 | 110 | 7
// 6 | Heavy | 4 | 4 | 97.5 | 7, 7, 7, 8
// 6 | Volume | 4 | 6 | 90 | 6, 7, 7, 8
// 7 | Heavy | 1 | 1 | 112.5 | 8
// 7 | Heavy | 4 | 4 | 100 | 7, 8, 8, 8
// 7 | Volume | 4 | 6 | 92.5 | 7, 7, 8, 8
// 8 | Heavy | 1 | 1 | 112.5 | 7
// 8 | Heavy | 4 | 4 | 100 | 7, 7, 8, 8
// 8 | Volume | 4 | 6 | 92.5 | 6, 7, 7, 8
// Preserve the source RPE here; ingestion floors it to the app's whole numbers.
export const steadyBenchWeeks: readonly BenchWeek[] = [
  {
    single: [105, 8],
    backoffWeight: 92.5,
    backoffRpes: [7, 7.5, 7.5, 8],
    volumeWeight: 85,
    volumeRpes: [7, 7.5, 7.5, 8],
  },
  {
    single: [105, 7.5],
    backoffWeight: 92.5,
    backoffRpes: [6.5, 7, 7.5, 7.5],
    volumeWeight: 85,
    volumeRpes: [6.5, 7, 7.5, 7.5],
  },
  {
    single: [107.5, 8],
    backoffWeight: 95,
    backoffRpes: [7, 7.5, 8, 8],
    volumeWeight: 87.5,
    volumeRpes: [7, 7.5, 8, 8],
  },
  {
    single: [107.5, 7.5],
    backoffWeight: 95,
    backoffRpes: [7, 7.5, 8, 8.5],
    volumeWeight: 87.5,
    volumeRpes: [7, 7.5, 8, 8.5],
  },
  {
    single: [110, 8],
    backoffWeight: 97.5,
    backoffRpes: [7, 7.5, 8, 8.5],
    volumeWeight: 90,
    volumeRpes: [7, 7.5, 8, 8],
  },
  {
    single: [110, 7.5],
    backoffWeight: 97.5,
    backoffRpes: [7, 7, 7.5, 8],
    volumeWeight: 90,
    volumeRpes: [6.5, 7, 7.5, 8],
  },
  {
    single: [112.5, 8],
    backoffWeight: 100,
    backoffRpes: [7.5, 8, 8, 8.5],
    volumeWeight: 92.5,
    volumeRpes: [7, 7.5, 8, 8.5],
  },
  {
    single: [112.5, 7.5],
    backoffWeight: 100,
    backoffRpes: [7, 7.5, 8, 8],
    volumeWeight: 92.5,
    volumeRpes: [6.5, 7, 7.5, 8],
  },
];

type BenchTrainingWeek = AlgorithmTrainingWeek;
export type BenchCheckpoint = AlgorithmCheckpoint;
export type BenchAlgorithmScenario = AlgorithmScenario;

// Scenario 2 — Same load, lower RPE — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 110 | 9
// 1 | Heavy | 4 | 4 | 95 | 8, 8, 8, 8
// 1 | Volume | 4 | 6 | 87.5 | 8, 8, 8, 9
// 2 | Heavy | 1 | 1 | 110 | 8
// 2 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 2 | Volume | 4 | 6 | 87.5 | 8, 8, 8, 8
// 3 | Heavy | 1 | 1 | 110 | 8
// 3 | Heavy | 4 | 4 | 95 | 7, 7, 8, 8
// 3 | Volume | 4 | 6 | 87.5 | 7, 8, 8, 8
// 4 | Heavy | 1 | 1 | 110 | 8
// 4 | Heavy | 4 | 4 | 95 | 7, 7, 7, 8
// 4 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 5 | Heavy | 1 | 1 | 110 | 8
// 5 | Heavy | 4 | 4 | 95 | 7, 7, 7, 7
// 5 | Volume | 4 | 6 | 87.5 | 7, 7, 7, 8
// 6 | Heavy | 1 | 1 | 110 | 7
// 6 | Heavy | 4 | 4 | 95 | 6, 7, 7, 7
// 6 | Volume | 4 | 6 | 87.5 | 7, 7, 7, 7
// 7 | Heavy | 1 | 1 | 110 | 7
// 7 | Heavy | 4 | 4 | 95 | 6, 6, 7, 7
// 7 | Volume | 4 | 6 | 87.5 | 6, 7, 7, 7
// 8 | Heavy | 1 | 1 | 110 | 7
// 8 | Heavy | 4 | 4 | 95 | 6, 6, 7, 7
// 8 | Volume | 4 | 6 | 87.5 | 6, 7, 7, 7
// Source RPE is preserved below; only recorded history is floored.
export const sameLoadLowerRpeBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [9] },
        { weight: 95, reps: 4, rpes: [8, 8, 8.5, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [8, 8.5, 8.5, 9] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8.5] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [8, 8, 8.5, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8.5] },
        { weight: 95, reps: 4, rpes: [7.5, 7.5, 8, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7.5, 8, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7, 7.5, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7.5, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7, 7, 7.5, 7.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 7.5, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [7.5] },
        { weight: 95, reps: 4, rpes: [6.5, 7, 7, 7.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7, 7.5, 7.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [7.5] },
        { weight: 95, reps: 4, rpes: [6.5, 6.5, 7, 7.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [6.5, 7, 7.5, 7.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [7] },
        { weight: 95, reps: 4, rpes: [6.5, 6.5, 7, 7] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [6.5, 7, 7, 7.5] }],
    },
  ],
];

// Scenario 3 — True plateau — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 110 | 8
// 1 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 1 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 2 | Heavy | 1 | 1 | 110 | 8
// 2 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 2 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 3 | Heavy | 1 | 1 | 110 | 8
// 3 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 3 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 4 | Heavy | 1 | 1 | 110 | 8
// 4 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 4 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 5 | Heavy | 1 | 1 | 110 | 8
// 5 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 5 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 6 | Heavy | 1 | 1 | 110 | 8
// 6 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 6 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 7 | Heavy | 1 | 1 | 110 | 8
// 7 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 7 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 8 | Heavy | 1 | 1 | 110 | 8
// 8 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 8 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// Source RPE is preserved below; only recorded history is floored.
export const plateauBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
];

// Scenario 4 — Gradual regression — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 112.5 | 8
// 1 | Heavy | 4 | 4 | 100 | 7, 8, 8, 8
// 1 | Volume | 4 | 6 | 92.5 | 7, 8, 8, 8
// 2 | Heavy | 1 | 1 | 112.5 | 8
// 2 | Heavy | 4 | 4 | 100 | 7, 8, 8, 8
// 2 | Volume | 4 | 6 | 92.5 | 7, 8, 8, 8
// 3 | Heavy | 1 | 1 | 112.5 | 8
// 3 | Heavy | 4 | 4 | 100 | 8, 8, 8, 9
// 3 | Volume | 4 | 6 | 90 | 7, 8, 8, 8
// 4 | Heavy | 1 | 1 | 110 | 8
// 4 | Heavy | 4 | 4 | 97.5 | 8, 8, 8, 9
// 4 | Volume | 4 | 6 | 90 | 8, 8, 8, 9
// 5 | Heavy | 1 | 1 | 110 | 8
// 5 | Heavy | 4 | 4 | 97.5 | 8, 8, 8, 9
// 5 | Volume | 4 | 6 | 90 | 8, 8, 8, 9
// 6 | Heavy | 1 | 1 | 110 | 9
// 6 | Heavy | 4 | 4 | 95 | 8, 8, 9, 9
// 6 | Volume | 4 | 6 | 87.5 | 8, 8, 8, 9
// 7 | Heavy | 1 | 1 | 107.5 | 8
// 7 | Heavy | 4 | 4 | 95 | 8, 8, 9, 9
// 7 | Volume | 4 | 6 | 87.5 | 8, 8, 9, 9
// 8 | Heavy | 1 | 1 | 107.5 | 9
// 8 | Heavy | 4 | 4 | 92.5 | 8, 8, 9, 9
// 8 | Volume | 4 | 6 | 85 | 8, 8, 9, 9
// Source RPE is preserved below; only recorded history is floored.
export const regressingBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [8] },
        { weight: 100, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 92.5, reps: 6, rpes: [7.5, 8, 8.5, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [8] },
        { weight: 100, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 92.5, reps: 6, rpes: [7.5, 8, 8.5, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [8.5] },
        { weight: 100, reps: 4, rpes: [8, 8, 8.5, 9] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [7.5, 8, 8.5, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 97.5, reps: 4, rpes: [8, 8, 8.5, 9] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [8, 8.5, 8.5, 9] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8.5] },
        { weight: 97.5, reps: 4, rpes: [8, 8, 8.5, 9] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [8, 8.5, 8.5, 9] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [9] },
        { weight: 95, reps: 4, rpes: [8, 8.5, 9, 9] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [8, 8.5, 8.5, 9] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [8.5] },
        { weight: 95, reps: 4, rpes: [8, 8.5, 9, 9] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [8.5, 8.5, 9, 9] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [9] },
        { weight: 92.5, reps: 4, rpes: [8, 8.5, 9, 9] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 85, reps: 6, rpes: [8.5, 8.5, 9, 9] }],
    },
  ],
];

// Scenario 5 — Deload and rebound — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 105 | 8
// 1 | Heavy | 4 | 4 | 92.5 | 7, 7, 7, 8
// 1 | Volume | 4 | 6 | 85 | 7, 7, 8, 8
// 2 | Heavy | 1 | 1 | 107.5 | 8
// 2 | Heavy | 4 | 4 | 95 | 7, 7, 8, 8
// 2 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 3 | Heavy | 1 | 1 | 107.5 | 7
// 3 | Heavy | 4 | 4 | 95 | 7, 7, 7, 8
// 3 | Volume | 4 | 6 | 87.5 | 6, 7, 7, 8
// 4 | Heavy | 1 | 1 | 110 | 8
// 4 | Heavy | 4 | 4 | 97.5 | 7, 8, 8, 8
// 4 | Volume | 4 | 6 | 90 | 7, 7, 8, 8
// 5 | Deload heavy | 1 | 1 | 95 | 6
// 5 | Deload heavy | 3 | 4 | 80 | 6, 6, 6
// 5 | Deload volume | 3 | 6 | 72.5 | 6, 6, 6
// 6 | Heavy | 1 | 1 | 110 | 7
// 6 | Heavy | 4 | 4 | 97.5 | 7, 7, 8, 8
// 6 | Volume | 4 | 6 | 90 | 7, 7, 8, 8
// 7 | Heavy | 1 | 1 | 112.5 | 8
// 7 | Heavy | 4 | 4 | 100 | 7, 8, 8, 8
// 7 | Volume | 4 | 6 | 92.5 | 7, 7, 8, 8
// 8 | Heavy | 1 | 1 | 115 | 8
// 8 | Heavy | 4 | 4 | 100 | 7, 7, 8, 8
// 8 | Volume | 4 | 6 | 92.5 | 7, 8, 8, 8
// Source RPE is preserved below; only recorded history is floored.
export const deloadBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 105, reps: 1, rpes: [8] },
        { weight: 92.5, reps: 4, rpes: [7, 7.5, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 85, reps: 6, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [7.5] },
        { weight: 95, reps: 4, rpes: [7, 7.5, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [6.5, 7, 7.5, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 97.5, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Deload heavy",
      groups: [
        { weight: 95, reps: 1, rpes: [6.5] },
        { weight: 80, reps: 4, rpes: [6, 6, 6.5] },
      ],
    },
    {
      kind: "volume",
      label: "Deload volume",
      groups: [{ weight: 72.5, reps: 6, rpes: [6, 6, 6.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [7.5] },
        { weight: 97.5, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [7, 7.5, 8, 8] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [8] },
        { weight: 100, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 92.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 115, reps: 1, rpes: [8.5] },
        { weight: 100, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 92.5, reps: 6, rpes: [7.5, 8, 8, 8.5] }],
    },
  ],
];

// Scenario 6 — Heavy + volume + technique — 3×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 105 | 8
// 1 | Heavy | 3 | 4 | 90 | 7, 7, 8
// 1 | Volume | 4 | 6 | 85 | 7, 7, 8, 8
// 1 | Technique | 3 | 5 | 75 | 6, 6, 6
// 2 | Heavy | 1 | 1 | 107.5 | 8
// 2 | Heavy | 3 | 4 | 92.5 | 7, 7, 8
// 2 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 2 | Technique | 3 | 5 | 77.5 | 6, 6, 7
// 3 | Heavy | 1 | 1 | 107.5 | 7
// 3 | Heavy | 3 | 4 | 92.5 | 6, 7, 7
// 3 | Volume | 4 | 6 | 87.5 | 6, 7, 7, 8
// 3 | Technique | 3 | 5 | 77.5 | 6, 6, 6
// 4 | Heavy | 1 | 1 | 110 | 8
// 4 | Heavy | 3 | 4 | 95 | 7, 7, 8
// 4 | Volume | 4 | 6 | 90 | 7, 7, 8, 8
// 4 | Technique | 3 | 5 | 80 | 6, 6, 7
// 5 | Heavy | 1 | 1 | 107.5 | 8
// 5 | Heavy | 3 | 4 | 92.5 | 7, 8, 8
// 5 | Volume | 4 | 6 | 87.5 | 7, 8, 8, 8
// 5 | Technique | 3 | 5 | 75 | 6, 6, 6
// 6 | Heavy | 1 | 1 | 110 | 7
// 6 | Heavy | 3 | 4 | 95 | 6, 7, 7
// 6 | Volume | 4 | 6 | 90 | 6, 7, 7, 8
// 6 | Technique | 3 | 5 | 80 | 6, 6, 6
// 7 | Heavy | 1 | 1 | 112.5 | 8
// 7 | Heavy | 3 | 4 | 97.5 | 7, 7, 8
// 7 | Volume | 4 | 6 | 92.5 | 7, 7, 8, 8
// 7 | Technique | 3 | 5 | 80 | 6, 6, 7
// 8 | Heavy | 1 | 1 | 112.5 | 7
// 8 | Heavy | 3 | 4 | 100 | 7, 7, 8
// 8 | Volume | 4 | 6 | 92.5 | 7, 8, 8, 8
// 8 | Technique | 3 | 5 | 82.5 | 6, 6, 7
// Source RPE is preserved below; only recorded history is floored.
export const threeDayBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 105, reps: 1, rpes: [8] },
        { weight: 90, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 85, reps: 6, rpes: [7, 7.5, 8, 8] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 75, reps: 5, rpes: [6, 6.5, 6.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [8] },
        { weight: 92.5, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 77.5, reps: 5, rpes: [6, 6.5, 7] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [7.5] },
        { weight: 92.5, reps: 4, rpes: [6.5, 7, 7.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [6.5, 7, 7.5, 8] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 77.5, reps: 5, rpes: [6, 6.5, 6.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 80, reps: 5, rpes: [6, 6.5, 7] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [8.5] },
        { weight: 92.5, reps: 4, rpes: [7.5, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7.5, 8, 8.5, 8.5] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 75, reps: 5, rpes: [6, 6, 6.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [7.5] },
        { weight: 95, reps: 4, rpes: [6.5, 7, 7.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 90, reps: 6, rpes: [6.5, 7, 7.5, 8] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 80, reps: 5, rpes: [6, 6.5, 6.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [8] },
        { weight: 97.5, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 92.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 80, reps: 5, rpes: [6, 6.5, 7] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [7.5] },
        { weight: 100, reps: 4, rpes: [7, 7.5, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 92.5, reps: 6, rpes: [7.5, 8, 8, 8.5] }],
    },
    {
      kind: "technique",
      label: "Technique",
      groups: [{ weight: 82.5, reps: 5, rpes: [6, 6.5, 7] }],
    },
  ],
];

// Scenario 7 — Low-frequency progression — 1×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy + backoff | 1 | 1 | 100 | 8
// 1 | Heavy + backoff | 4 | 4 | 87.5 | 7, 7, 8, 8
// 2 | Heavy + backoff | 1 | 1 | 102.5 | 8
// 2 | Heavy + backoff | 4 | 4 | 90 | 7, 7, 8, 8
// 3 | Heavy + backoff | 1 | 1 | 102.5 | 7
// 3 | Heavy + backoff | 4 | 4 | 90 | 7, 7, 8, 8
// 4 | Heavy + backoff | 1 | 1 | 105 | 8
// 4 | Heavy + backoff | 4 | 4 | 92.5 | 7, 7, 8, 8
// 5 | Heavy + backoff | 1 | 1 | 105 | 8
// 5 | Heavy + backoff | 4 | 4 | 90 | 7, 8, 8, 8
// 6 | Heavy + backoff | 1 | 1 | 107.5 | 8
// 6 | Heavy + backoff | 4 | 4 | 92.5 | 7, 7, 8, 8
// 7 | Heavy + backoff | 1 | 1 | 107.5 | 7
// 7 | Heavy + backoff | 4 | 4 | 95 | 7, 7, 8, 8
// 8 | Heavy + backoff | 1 | 1 | 110 | 8
// 8 | Heavy + backoff | 4 | 4 | 95 | 7, 7, 8, 8
// Source RPE is preserved below; only recorded history is floored.
export const weeklyBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 100, reps: 1, rpes: [8] },
        { weight: 87.5, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 102.5, reps: 1, rpes: [8] },
        { weight: 90, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 102.5, reps: 1, rpes: [7.5] },
        { weight: 90, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 105, reps: 1, rpes: [8] },
        { weight: 92.5, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 105, reps: 1, rpes: [8.5] },
        { weight: 90, reps: 4, rpes: [7.5, 8, 8.5, 8.5] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 107.5, reps: 1, rpes: [8] },
        { weight: 92.5, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 107.5, reps: 1, rpes: [7.5] },
        { weight: 95, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy + backoff",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
  ],
];

// Scenario 8 — Mixed / missing RPE fallback — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 105 | 8
// 1 | Heavy | 4 | 4 | 92.5 | 7, 8, 8, 8
// 1 | Volume (RPE omitted) | 4 | 6 | 85 | —, —, —, —
// 2 | Heavy | 1 | 1 | 105 | 7
// 2 | Heavy | 4 | 4 | 92.5 | 7, 7, 8, 8
// 2 | Volume (RPE omitted) | 4 | 6 | 85 | —, —, —, —
// 3 | Heavy | 1 | 1 | 107.5 | 8
// 3 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 3 | Volume (RPE omitted) | 4 | 6 | 87.5 | —, —, —, —
// 4 | Heavy | 1 | 1 | 107.5 | —
// 4 | Heavy | 4 | 4 | 95 | —, —, —, —
// 4 | Volume (RPE omitted) | 4 | 6 | 87.5 | —, —, —, —
// 5 | Heavy | 1 | 1 | 110 | 8
// 5 | Heavy | 4 | 4 | 97.5 | 7, 8, 8, 8
// 5 | Volume (RPE omitted) | 4 | 6 | 90 | —, —, —, —
// 6 | Heavy | 1 | 1 | 110 | 7
// 6 | Heavy | 4 | 4 | 97.5 | 7, 7, 8, 8
// 6 | Volume (RPE omitted) | 4 | 6 | 90 | —, —, —, —
// 7 | Heavy | 1 | 1 | 112.5 | 8
// 7 | Heavy | 4 | 4 | 100 | 7, 8, 8, 8
// 7 | Volume (RPE omitted) | 4 | 6 | 92.5 | —, —, —, —
// 8 | Heavy | 1 | 1 | 112.5 | —
// 8 | Heavy | 4 | 4 | 100 | —, —, —, —
// 8 | Volume (RPE omitted) | 4 | 6 | 92.5 | —, —, —, —
// Source RPE is preserved below; only recorded history is floored.
export const missingRpeBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 105, reps: 1, rpes: [8] },
        { weight: 92.5, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 85, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 105, reps: 1, rpes: [7.5] },
        { weight: 92.5, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 85, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 87.5, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 107.5, reps: 1, rpes: [null] },
        { weight: 95, reps: 4, rpes: [null, null, null, null] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 87.5, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 97.5, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 90, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [7.5] },
        { weight: 97.5, reps: 4, rpes: [7, 7.5, 8, 8] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 90, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [8] },
        { weight: 100, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 92.5, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 112.5, reps: 1, rpes: [null] },
        { weight: 100, reps: 4, rpes: [null, null, null, null] },
      ],
    },
    {
      kind: "volume",
      label: "Volume (RPE omitted)",
      groups: [{ weight: 92.5, reps: 6, rpes: [null, null, null, null] }],
    },
  ],
];

// Scenario 9 — RPE outlier sensitivity — 2×/week.
// Week | Session | Sets | Reps | Weight (kg) | Stored RPE
// ---: | --- | ---: | ---: | ---: | ---
// 1 | Heavy | 1 | 1 | 110 | 8
// 1 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 1 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 2 | Heavy | 1 | 1 | 110 | 8
// 2 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 2 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 3 | Heavy | 1 | 1 | 110 | 8
// 3 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 3 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 4 | Heavy | 1 | 1 | 110 | 8
// 4 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 4 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 5 | Heavy | 1 | 1 | 110 | 8
// 5 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 5 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 6 | Heavy | 1 | 1 | 110 | 8
// 6 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 6 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 7 | Heavy | 1 | 1 | 110 | 8
// 7 | Heavy | 4 | 4 | 95 | 7, 8, 8, 8
// 7 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// 8 | Heavy (RPE outlier) | 1 | 1 | 110 | 6
// 8 | Heavy (RPE outlier) | 4 | 4 | 95 | 7, 8, 8, 8
// 8 | Volume | 4 | 6 | 87.5 | 7, 7, 8, 8
// Source RPE is preserved below; only recorded history is floored.
export const outlierBenchWeeks: readonly BenchTrainingWeek[] = [
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: 110, reps: 1, rpes: [8] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
  [
    {
      kind: "heavy",
      label: "Heavy (RPE outlier)",
      groups: [
        { weight: 110, reps: 1, rpes: [6.5] },
        { weight: 95, reps: 4, rpes: [7.5, 8, 8, 8.5] },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: 87.5, reps: 6, rpes: [7, 7.5, 8, 8.5] }],
    },
  ],
];

function buildBenchScenario(
  number: number,
  title: string,
  intent: string,
  weeks: readonly BenchTrainingWeek[],
): BenchAlgorithmScenario {
  return buildAlgorithmScenario({
    number,
    title,
    intent,
    liftFamily: "bench",
    workoutIdPrefix: `scenario_${number}`,
    weeks,
  });
}

const steadySessions: readonly BenchTrainingWeek[] = steadyBenchWeeks.map(
  (week) => [
    {
      kind: "heavy",
      label: "Heavy",
      groups: [
        { weight: week.single[0], reps: 1, rpes: [week.single[1]] },
        { weight: week.backoffWeight, reps: 4, rpes: week.backoffRpes },
      ],
    },
    {
      kind: "volume",
      label: "Volume",
      groups: [{ weight: week.volumeWeight, reps: 6, rpes: week.volumeRpes }],
    },
  ],
);

export const benchAlgorithmScenarios: readonly BenchAlgorithmScenario[] = [
  buildBenchScenario(
    1,
    "Steady progression — 2×/week",
    "Normal improving block. Load rises over time and some repeated loads become easier.",
    steadySessions,
  ),
  buildBenchScenario(
    2,
    "Same load, lower RPE — 2×/week",
    "The lifter deliberately keeps the weights fixed while those weights become easier.",
    sameLoadLowerRpeBenchWeeks,
  ),
  buildBenchScenario(
    3,
    "True plateau — 2×/week",
    "Eight weeks of essentially unchanged performance with regular exposure.",
    plateauBenchWeeks,
  ),
  buildBenchScenario(
    4,
    "Gradual regression — 2×/week",
    "A sustained decline: lower heavy loads and/or the same loads costing more RPE.",
    regressingBenchWeeks,
  ),
  buildBenchScenario(
    5,
    "Deload and rebound — 2×/week",
    "Four loading weeks, a deliberate low-fatigue week, then stronger training after the deload.",
    deloadBenchWeeks,
  ),
  buildBenchScenario(
    6,
    "Heavy + volume + technique — 3×/week",
    "Three exposures: a specific heavy day, a moderate-volume day, and an easy technique day.",
    threeDayBenchWeeks,
  ),
  buildBenchScenario(
    7,
    "Low-frequency progression — 1×/week",
    "A lower-frequency bench setup. The lifter still progresses, but each performance day is a week apart.",
    weeklyBenchWeeks,
  ),
  buildBenchScenario(
    8,
    "Mixed / missing RPE fallback — 2×/week",
    "The lifter sometimes skips RPE. Missing RPE must use the raw formula instead of inventing effort.",
    missingRpeBenchWeeks,
  ),
  buildBenchScenario(
    9,
    "RPE outlier sensitivity — 2×/week",
    "Real-world logging noise: seven weeks look stable, then one set is logged with an unusually low RPE.",
    outlierBenchWeeks,
  ),
];

// Keep the original scenario 1 exports and source identities stable.
export const steadyBenchHistory = benchAlgorithmScenarios[0].history;
export const steadyBenchCheckpoints = benchAlgorithmScenarios[0].checkpoints;
