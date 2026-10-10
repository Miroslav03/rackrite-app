# Native Storybook

Run the real React Native Progress view with deterministic, in-memory fixtures:

```sh
npm run storybook:android
# Or start Metro and connect a development client manually:
npm run storybook
# iOS development client:
npm run storybook:ios
```

Storybook uses port **8082** and the existing RackRite development app. Use the
bottom story browser to choose a Progress category and scenario.
The fullscreen button hides Storybook's chrome. The addons button opens
**Controls**, **Actions**, and **Notes**. Notes describe what each fixture shows.
The initial lift control resets the preview; the screen's lift selector remains
interactive and logs events in Actions.

The first native build after installing these dependencies needs a rebuild:

```sh
npm install
npm run android -- --no-bundler
npm run storybook:android
```

For iOS, build with `npm run ios -- --no-bundler` first. A development client is
required. Restart Metro with `npm run storybook:android -- --clear` if its cache
retains an earlier configuration.

## Normal app launches

`npm run start -- --dev-client` and `npm run android` still launch RackRite.
Storybook replaces the entry point only when `STORYBOOK_ENABLED=true`; its startup
does not mount the app layout, database bootstrap, or workout-session provider.
Normal and Storybook Metro servers may coexist on separate ports, but the single
installed app displays one launch mode at a time. Keep `STORYBOOK_ENABLED` unset
for production exports.

## Stories and fixtures

Stories live in `src/features/progress/view/stories/`, next to the production view.
Each scenario has a named export in its category's `.stories.tsx` file. To add one:

1. Add a deterministic fixture/scenario in `progressStory.scenarios.ts`.
2. Add a named `Story` export using `createProgressStory("scenario-id")` in the
   matching category. The helper supplies the display name and Notes.
3. Run the coverage and interaction tests below. They require every scenario to
   appear exactly once in Storybook.

Story discovery scans `src/**/*.stories.tsx` and `src/**/*.stories.ts`.
Metro generates `.rnstorybook/storybook.requires.ts`; do not edit or commit it.

Derived-history, early and empty fixtures use the real analyzer. Other scenarios
override analysis fields to expose visual states; domain tests establish which
histories actually produce those classifications. Fixed local dates prevent
recency changes. No stories save workouts or call repositories.

### Algorithm scenarios by lift

**Progress → Algorithm scenarios** contains **160 checkpoints**: 144 under
**Bench → Scenario 1–9** and 16 under **Squat → Scenario 1**. Each checkpoint
renders the real analyzer results using only completed history through its session.

### Bench algorithm scenarios

**Progress → Algorithm scenarios → Bench → Scenario 1–9** contains all 144 checkpoints
from the eight-week bench fixture pack. Scenario 1 retains its original 16 stories;
scenarios 2–9 add 128 stories. Every story supplies only history completed through
that session to `analyzeCompetitionLifts`, then renders the production cards.
There are no status, evidence, diagnosis, or benchmark overrides.

| Scenario | Pattern | Checkpoints |
| --- | --- | ---: |
| 1 | Steady progression | 16 |
| 2 | Same load, lower RPE | 16 |
| 3 | True plateau | 16 |
| 4 | Gradual regression | 16 |
| 5 | Deload and rebound | 16 |
| 6 | Heavy + volume + technique | 24 |
| 7 | Once-weekly progression | 8 |
| 8 | Mixed / missing RPE | 16 |
| 9 | RPE outlier | 16 |

Select a **Week N · Session** story, then open **Notes** to see its intent,
accumulated input sets, actual results, unavailable reasons, and winning
estimated-max source sets. Inspect Strength Now, Next Action, and Why for the
calculated strength, effort, workload, and consistency results. Grouped
week/set/rep/weight/RPE comment tables accompany every scenario in
`benchAlgorithm.fixtures.ts`.

Sessions finish at 18:00 local time, starting January 5, 2026: heavy on Mondays,
volume on Thursdays, and technique on Saturdays when present. RPE is floored
to whole numbers (7.5 → 7, 6.5 → 6); decimal weights remain unchanged and missing
RPE remains null. RPE below 7 counts toward workload but supplies no strength
estimate. Analysis runs immediately after each session, so the current calendar
week is incomplete for workload comparisons.

The [execution report](../docs/specs/progress/bench-algorithm-results.md) records
every checkpoint's card results, weekly reference-versus-actual estimates,
winning source sets, and explanations of differences and status gaps. Scenarios
test the current algorithm; their names do not force a matching status. In
particular, the RPE outlier floors below the eligibility threshold, so scenario 9
exercises exclusion and rolling-window expiry instead of the intended spike.

The Bench groups retain their original Storybook IDs, so existing story links
resolve after adding the Bench folder and saved selection IDs remain valid.
Storybook 10.5.1's native index ignores explicit CSF metadata IDs; the startup
adapter in `storyIndex.ts` applies those IDs before selection and after hot reload.
Cold launches use the existing configured Overview default, which takes precedence
over a saved selection in this Storybook version.

### Squat algorithm scenario

**Progress → Algorithm scenarios → Squat → Scenario 1** contains 16 checkpoints
from an eight-week, twice-weekly progression. Stories open with Squat selected.
Monday combines one heavy single at RPE 8 with 3×4 backoff sets; Thursday uses
4×5 volume work. Heavy singles rise from 225 to 232.5 kg, backoffs from 200 to
207.5 kg, and volume work from 190 to 197.5 kg, in 2.5 kg steps every two weeks.
The schedule and RPE-flooring rules are the same as the Bench fixtures.

The [Squat execution report](../docs/specs/progress/squat-algorithm-results.md)
contains the research rationale, grouped inputs, weekly estimates, and all
16 checkpoint results. This is authored synthetic competition squat data;
warmups, accessories, and other lifts are omitted. No analyzer fields are
overridden. The final estimate is **249.0 kg**, with **confirmed progressing**
status and **strong evidence**; early checkpoints retain their actual learning
and stable states. Fixture comment tables are in `squatAlgorithm.fixtures.ts`.

Refresh-error stories hide benchmarks until **Try Again** or pull-to-refresh.
Pending/retrying stories hold their spinner until **Complete simulated refresh**.
Switching stories resets lift, refresh and open sheets.

## Dependency compatibility

The official initializer was run with `npm create storybook@latest`. Its 10.6.0
native release requires newer Reanimated and safe-area versions than Expo 55.
Storybook packages are pinned together at **10.5.1**, and Reanimated is pinned to
the app's existing **4.2.1**. The explicit UI/theming package pins prevent their
transitive ranges from pulling a newer incompatible native release.

AsyncStorage persists story selection; the bottom sheet, slider, date picker and
SVG packages support Storybook's native browser and controls. Expo-managed native
packages use the versions specified by Expo 55. No existing installed package
versions were upgraded.

## Verification

```sh
npm run test:once -- --runInBand src/domain/progress src/features/progress .rnstorybook/tests
npm run test:once -- --runInBand src/features/progress/view/stories/tests/benchAlgorithm.test.ts
npm run test:once -- --runInBand src/features/progress/view/stories/tests/squatAlgorithm.test.ts
npm run test:once -- --runInBand .rnstorybook/tests/storyIndex.test.ts
npx tsc --noEmit
npm run lint
npx expo export --platform android --source-maps --output-dir /tmp/rackrite-production-export
```

On Android, check story selection, scrolling, lift changes, explanatory cards,
methods-sheet dismissal with Back, and refresh recovery. Check normal
app startup separately. The production source map must contain no Storybook,
story, fixture or former playground modules.
