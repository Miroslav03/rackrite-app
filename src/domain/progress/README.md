# Progress domain

Start with `analysis/progress.useCases.ts`. Its `analyzeCompetitionLifts`
function builds an overview for squat, bench, and deadlift. Follow
`analyzeLift` in `analysis/progress.analysis.utils.ts` to see the steps for
one lift.

## Reading order

| Folder            | Question it answers                                                      | Main entry                  |
| ----------------- | ------------------------------------------------------------------------ | --------------------------- |
| `history/`        | What completed competition-lift records can analysis read?               | `progress.history.types.ts` |
| `performance/`    | What strength estimate can weight, reps, and optional RPE support?       | `progress.performance.ts`   |
| `sessions/`       | What represents one competition lift in one workout?                     | `deriveLiftSessions`        |
| `trends/`         | How do daily performance, effort, and weekly workload compare over time? | `deriveLiftTrends`          |
| `status/`         | Is the recorded pattern sufficient and confirmed?                        | `assessLiftStatus`          |
| `evidence/`       | How well do the recorded data support that status?                       | `assessEvidence`            |
| `diagnosis/`      | Is there enough evidence for a possible explanation?                     | `diagnoseLift`              |
| `recommendation/` | Which action category fits the assessment?                               | `recommendLiftAction`       |
| `benchmark/`      | Is there a defensible load/repetition target?                            | `generateBenchmarkTarget`   |
| `analysis/`       | How do these results form one coherent overview?                         | `analyzeCompetitionLifts`   |

`measurements/` owns available/unavailable measurements, percentage changes,
and median calculation. Multiple modules use those numerical operations.
`progress.config.ts` keeps the existing thresholds together so they can be
tuned and tested consistently.

## Within a folder

For example, `trends/` contains:

```text
trends/
  progress.trends.ts        Main calculation: read this first
  progress.trends.utils.ts  Supporting calculations
  progress.trends.types.ts  Data contracts
  tests/
    progress.trends.test.ts
```

The main file coordinates the calculation or expresses its decision rules.
The utility file holds supporting functions owned by that module. The type
file describes inputs and results without importing implementations.
Small modules have only the files they need: recommendation selection needs
no utility file, and performance formulas use numbers and the shared
configuration without introducing additional types.

Tests live with their module. The analysis tests cover combined status,
evidence, diagnosis, and recommendation behavior. Reusable history fixtures
remain in `tests/progress.test.helpers.ts`.

## Dependencies

Import each type or function from its owning file. There is no central type
barrel or duplicate copy of a shared contract. Main calculations may use
other modules' calculations; utility files must not import their own main
file and create a cycle. Keep helpers private unless another file uses them.

All these calculations remain pure. They accept history and an explicit
analysis time; they do not read SQLite, render UI, or modify logged workouts.
The repository contract lives in `history/`, while its SQLite implementation
remains in `src/data/repositories/progressRepository.ts`.
