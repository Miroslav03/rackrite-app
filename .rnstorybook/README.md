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
bottom story browser to choose among 62 scenarios in 11 Progress categories.
The fullscreen button hides Storybook's chrome. The addons button opens
**Controls**, **Actions**, and **Notes**. Notes describe what each fixture shows.
Initial lift/metric controls reset the preview; the screen's own selectors remain
interactive and log events in Actions.

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
   matching category. The helper supplies the display name, initial metric and Notes.
3. Run the coverage and interaction tests below. They require every scenario to
   appear exactly once in Storybook.

Story discovery scans `src/**/*.stories.tsx` and `src/**/*.stories.ts`.
Metro generates `.rnstorybook/storybook.requires.ts`; do not edit or commit it.

Derived-history, early and empty fixtures use the real analyzer. Other scenarios
override analysis fields to expose visual states; domain tests establish which
histories actually produce those classifications. Fixed local dates prevent
recency changes. No stories save workouts or call repositories.

Refresh-error stories hide benchmarks until **Try Again** or pull-to-refresh.
Pending/retrying stories hold their spinner until **Complete simulated refresh**.
Switching stories resets lift, metric, chart selection, refresh and open sheets.

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
npm run test:once -- --runInBand src/features/progress/view src/shared/components/charts
npx tsc --noEmit
npm run lint
npx expo export --platform android --source-maps --output-dir /tmp/rackrite-production-export
```

On Android, check story selection, scrolling, lift/metric changes, chart bar
selection, methods-sheet dismissal with Back, and refresh recovery. Check normal
app startup separately. The production source map must contain no Storybook,
story, fixture or former playground modules.
