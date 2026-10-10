# Squat algorithm execution results — scenario 1

Final result: **249.0 kg estimated max**, **confirmed progressing**, **strong evidence**. The six-week matched reps/RPE strength change is **+2.5%** (unrounded: 2.4691358024691468%). Effort is unchanged, the diagnosis is `none`, and the action is `continue_approach`. The supported benchmark is **200×5 @7–8**, a 2.5 kg increase from the familiar 197.5 kg volume load.

Browse **Progress → Algorithm scenarios → Squat → Scenario 1**. One story follows each completed session: **16 Squat checkpoints**, alongside **144 Bench checkpoints** under **Bench → Scenario 1–9**, for **160 total**. Squat stories initially select Squat and render the production cards without overrides.

## Training rationale and scope

This is authored synthetic data for a lifter around a 250 kg squat, not an observed athlete log or a copied named program. All heavy singles exceed 220 kg; backoff and volume loads are intentionally lighter. Loads increase 2.5 kg every two weeks while effort and set counts stay comparable. The scenario tests a modest improving development block rather than a meet peak.

- A submaximal single followed by sets of four or five mirrors the competition-lift structure described in [Barbell Medicine’s intermediate/advanced template](https://www.barbellmedicine.com/blog/scivationstrong/). That source also explains using RPE to control training stress and making small load increases when effort allows. This fixture adapts those principles into one heavy day and one volume day; it does not copy the source’s complete schedule.
- [Juggernaut’s squat training examples](https://www.jtsstrength.com/the-greatest-squat-article-ever/) illustrate multiple approaches, including repeated weekly squat exposures and combinations of heavy and volume work. They support the training structure, not a universal prescription or the exact fixture weights.
- Only competition squat working sets are recorded. Warmups, accessories, variations, bench, and deadlift are omitted. There are no missed sessions, deloads, or maximal attempts in this controlled scenario.

Inputs and their grouped comment table are in [the Squat fixture](../../../src/features/progress/view/stories/squatAlgorithm.fixtures.ts). The shared fixture builder constructs completed exposure records with source IDs and passes each chronological prefix to `analyzeCompetitionLifts`.

## Recorded inputs

Every session finishes at 18:00 local time. Monday heavy starts January 5, 2026; Thursday volume starts January 8. Each week contains one 1×1 @8 single and 3×4 backoffs on Monday, then 4×5 volume on Thursday. Source backoff RPE is `[7, 7.5, 8]`; source volume RPE is `[7, 7.5, 8, 8]`.

| Week | Session | Sets | Reps | Weight (kg) | Source RPE | Stored RPE |
| ---: | --- | ---: | ---: | ---: | --- | --- |
| 1 | Heavy | 1 | 1 | 225 | 8 | 8 |
| 1 | Heavy | 3 | 4 | 200 | 7, 7.5, 8 | 7, 7, 8 |
| 1 | Volume | 4 | 5 | 190 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 2 | Heavy | 1 | 1 | 225 | 8 | 8 |
| 2 | Heavy | 3 | 4 | 200 | 7, 7.5, 8 | 7, 7, 8 |
| 2 | Volume | 4 | 5 | 190 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 3 | Heavy | 1 | 1 | 227.5 | 8 | 8 |
| 3 | Heavy | 3 | 4 | 202.5 | 7, 7.5, 8 | 7, 7, 8 |
| 3 | Volume | 4 | 5 | 192.5 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 4 | Heavy | 1 | 1 | 227.5 | 8 | 8 |
| 4 | Heavy | 3 | 4 | 202.5 | 7, 7.5, 8 | 7, 7, 8 |
| 4 | Volume | 4 | 5 | 192.5 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 5 | Heavy | 1 | 1 | 230 | 8 | 8 |
| 5 | Heavy | 3 | 4 | 205 | 7, 7.5, 8 | 7, 7, 8 |
| 5 | Volume | 4 | 5 | 195 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 6 | Heavy | 1 | 1 | 230 | 8 | 8 |
| 6 | Heavy | 3 | 4 | 205 | 7, 7.5, 8 | 7, 7, 8 |
| 6 | Volume | 4 | 5 | 195 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 7 | Heavy | 1 | 1 | 232.5 | 8 | 8 |
| 7 | Heavy | 3 | 4 | 207.5 | 7, 7.5, 8 | 7, 7, 8 |
| 7 | Volume | 4 | 5 | 197.5 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |
| 8 | Heavy | 1 | 1 | 232.5 | 8 | 8 |
| 8 | Heavy | 3 | 4 | 207.5 | 7, 7.5, 8 | 7, 7, 8 |
| 8 | Volume | 4 | 5 | 197.5 | 7, 7.5, 8, 8 | 7, 7, 8, 8 |

## Analysis rules and observed behavior

- Only RPE is floored (`7.5 → 7`); decimal weights remain unchanged. Analysis retains unrounded domain values. Report estimates are formatted to 0.1 kg and percentage/RPE changes to one decimal.
- All recorded sets meet the minimum stored RPE of 7 and the formula’s effective-repetition limit of 10. The builder retains complete recorded inputs; eligibility remains a domain decision.
- Current estimated max uses the strongest retained representative over the latest three eligible performance days, independently of the trend basis. In this fixture the easier four-rep backoffs win, rather than the heavier singles. Their raw estimates meet the 95% representative floor. Equal retained sources from different heavy sessions are listed together.
- The winning backoff formula is `weight × 36 / (37 − 4 − (10 − 7)) = weight × 1.2`. Thus 200×4 @7 produces 240.0 kg and 207.5×4 @7 produces 249.0 kg. The final 232.5×1 @8 single instead produces 246.2 kg; the final 197.5×5 @7 volume set produces 245.2 kg.
- Flooring creates an equal estimate for the first and second backoff sets, but source tracing uses the analyzer’s selected session representative rather than listing every unselected set. The 7.0 RPE source was already eligible, so flooring does not change this fixture’s weekly winning values.
- The six-week strength comparison initially uses an effort-adjusted fallback, then gains enough matched reps/RPE coverage in week 6. Its basis and confirmation are kept separate from the max estimate. The rising max does not force a progressing status: weeks 1–4 remain learning, weeks 5–7 remain stable, and the final Monday is still stable. The final Thursday confirms progressing.
- Early effort comparisons can return `partial_rpe` despite every set having RPE because each comparison half needs enough usable days. Effort becomes available in week 5 and stays unchanged at 0.0 RPE.
- Workload compares complete calendar weeks and excludes the current partial week. It is unavailable with `incomplete_period` through week 7, then available in week 8: volume +2.1%, hard sets 0.0%, frequency 0.0%. A Thursday completion does not complete the calendar week.
- The final benchmark is generated from familiar recent five-rep volume work, not from the winning max-estimate set. Earlier checkpoints preserve the actual learning/weak-evidence reasons or comparable-repeat targets.

## Weekly independently calculated estimated max

Each row is the Thursday checkpoint. The independent calculation uses the known eligible four-rep backoff at stored RPE 7, without calling the production estimate function.

| Week | Independent estimate | Actual app | Winning retained source(s) | Final weekly status |
| ---: | ---: | ---: | --- | --- |
| 1 | 240.0 kg | 240.0 kg | W1 D1 Heavy: 200×4 @7 | learning |
| 2 | 240.0 kg | 240.0 kg | W2 D1 Heavy: 200×4 @7 | learning |
| 3 | 243.0 kg | 243.0 kg | W3 D1 Heavy: 202.5×4 @7 | learning |
| 4 | 243.0 kg | 243.0 kg | W4 D1 Heavy: 202.5×4 @7 | learning |
| 5 | 246.0 kg | 246.0 kg | W5 D1 Heavy: 205×4 @7 | stable |
| 6 | 246.0 kg | 246.0 kg | W6 D1 Heavy: 205×4 @7 | stable |
| 7 | 249.0 kg | 249.0 kg | W7 D1 Heavy: 207.5×4 @7 | stable |
| 8 | 249.0 kg | 249.0 kg | W8 D1 Heavy: 207.5×4 @7 | progressing |

## Lift Status card — every session

The card’s max-change label compares the current max with the median baseline for the same estimate formula. At the final checkpoint it shows **+6.5 kg** versus a **242.5 kg** adjusted baseline (unrounded: 242.5344827586207 kg), distinct from the 9.0 kg gain against the first checkpoint. `—` means the card has no comparison label.

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days / reasons | Displayed max change (kg) |
| --- | ---: | --- | --- | --- | --- | --- |
| W1 D1 Heavy | 240.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 / limited_history | — |
| W1 D2 Volume | 240.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 / limited_history | — |
| W2 D1 Heavy | 240.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 / limited_history | — |
| W2 D2 Volume | 240.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 / limited_history | — |
| W3 D1 Heavy | 243.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 / limited_history | — |
| W3 D2 Volume | 243.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 / limited_history | — |
| W4 D1 Heavy | 243.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 3 of 5 / limited_history | — |
| W4 D2 Volume | 243.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 2 of 5 / limited_history | — |
| W5 D1 Heavy | 246.0 kg | effort_adjusted | stable | confirming_change / false | weak / 4 of 5 / limited_history | +6 |
| W5 D2 Volume | 246.0 kg | effort_adjusted | stable | confirmed_trend / true | moderate / 3 of 5 / consistent_pattern | +8.1 |
| W6 D1 Heavy | 246.0 kg | effort_adjusted | stable | confirmed_trend / true | weak / 3 of 5 / limited_history | +6 |
| W6 D2 Volume | 246.0 kg | effort_adjusted | stable | confirming_change / false | weak / 1 of 5 / limited_history | +6.5 |
| W7 D1 Heavy | 249.0 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 / limited_history | +9.5 |
| W7 D2 Volume | 249.0 kg | effort_adjusted | stable | confirmed_trend / true | weak / 3 of 5 / limited_history | +9.5 |
| W8 D1 Heavy | 249.0 kg | effort_adjusted | stable | confirmed_trend / true | weak / 2 of 5 / limited_history | +8 |
| W8 D2 Volume | 249.0 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 / consistent_pattern | +6.5 |

## Why This Status and Performance Trend cards — every session

| Checkpoint | Strength change / trend basis | Effort change / basis | Typical RPE change | Hard sets change | Frequency change | Volume change |
| --- | --- | --- | --- | --- | --- | --- |
| W1 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W1 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D1 Heavy | 0.4% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | 1.9% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | 1.1% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 2.5% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 1.2% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 1.2% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 2.2% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | 0.0% | 0.0% | 2.1% |
| W8 D2 Volume | 2.5% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | 0.0% | 0.0% | 2.1% |

## Next Action card — every session

| Checkpoint | Diagnosis / evidence / reasons | Action | Benchmark or unavailable reason |
| --- | --- | --- | --- |
| W1 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W1 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W5 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W5 D2 Volume | none / moderate / — | continue_approach | repeat: 195×5 @7–8 (comparable_repeat) |
| W6 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W8 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W8 D2 Volume | none / strong / productive_training | continue_approach | progress: 200×5 @7–8 (supported_progression) |

## Estimated-max source trace — every session

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 200×4 @7 |
| W1 D2 Volume | W1 D1 Heavy: 200×4 @7 |
| W2 D1 Heavy | W1 D1 Heavy: 200×4 @7<br>W2 D1 Heavy: 200×4 @7 |
| W2 D2 Volume | W2 D1 Heavy: 200×4 @7 |
| W3 D1 Heavy | W3 D1 Heavy: 202.5×4 @7 |
| W3 D2 Volume | W3 D1 Heavy: 202.5×4 @7 |
| W4 D1 Heavy | W3 D1 Heavy: 202.5×4 @7<br>W4 D1 Heavy: 202.5×4 @7 |
| W4 D2 Volume | W4 D1 Heavy: 202.5×4 @7 |
| W5 D1 Heavy | W5 D1 Heavy: 205×4 @7 |
| W5 D2 Volume | W5 D1 Heavy: 205×4 @7 |
| W6 D1 Heavy | W5 D1 Heavy: 205×4 @7<br>W6 D1 Heavy: 205×4 @7 |
| W6 D2 Volume | W6 D1 Heavy: 205×4 @7 |
| W7 D1 Heavy | W7 D1 Heavy: 207.5×4 @7 |
| W7 D2 Volume | W7 D1 Heavy: 207.5×4 @7 |
| W8 D1 Heavy | W7 D1 Heavy: 207.5×4 @7<br>W8 D1 Heavy: 207.5×4 @7 |
| W8 D2 Volume | W8 D1 Heavy: 207.5×4 @7 |

## Assessment

The algorithm detects the intended improvement by the final checkpoint: estimated max rises 9.0 kg (+3.75%) over the block, while the rolling matched strength comparison rises 2.5%. Those percentages use different baselines. Detection is deliberately cautious and delayed: the same improving history remains stable at earlier checkpoints because comparison coverage, repeated support, and confirmation have not yet aligned. Strong evidence describes consistency in this synthetic record, not certainty about physiological adaptation.

The Bench refactor preserves the original fixture exports, IDs, timestamps, history prefixes, Notes, and all 144 overview snapshots. Explicit Storybook metadata IDs preserve existing Bench links and saved selection IDs despite the new Bench folder. Storybook 10.5.1's native index ignores these metadata IDs, so a small startup adapter applies them to the device index before selection and after hot reload. No dependency patch or upgrade is needed.

## Historical verification (before chart removal)

- **65 targeted tests pass**: 43 existing Bench tests, 19 Squat tests, and 3 native-index compatibility tests. Tests cover exact source inputs, RPE flooring, comment/report accuracy, timestamps and ownership, chronological prefixes, lift isolation, globally unique IDs, 160 named story exports, independently calculated estimates, actual early classifications, winning sets, Notes, and the final benchmark.
- A direct deep comparison against the pre-change baseline confirms that all nine Bench histories and all 144 overview snapshots remain unchanged; all 144 Bench Notes also match exactly. CSF indexing confirms unchanged IDs for all 144 Bench stories. Each Bench module has only its intended title/metadata-ID change. File hashes confirm that unrelated workspace changes, the source scenario document, existing Bench report, production host, and shared story factory remain unchanged.
- **Broader suite: 248 passed, 1 existing failure**. The unchanged view-model assertion at `src/features/progress/view/tests/progress.viewModel.test.ts:286` expects “No change vs baseline” where production returns null.
- **Type-checking:** only the existing `performanceLabel` reference error remains at `src/features/progress/view/tests/progress.liftStatusCard.test.ts:73`.
- **Lint:** blocked because ESLint is not installed. No tooling or dependencies were added.
- **Formatting and whitespace:** Prettier passes on all changed TypeScript/story files; `git diff --check` passes. Local Markdown links resolve.
- **Native Android:** every Squat checkpoint was selected and checked for its initial lift, estimate, status, and folder. All nine final Bench checkpoints resolve through their original deep links with unchanged values and the new Bench folder. Final Squat Notes show the correct 16-session prefix, winning backoff, 249.0 kg estimate, strong evidence, and 200×5 @7–8 benchmark. Effort, Workload, and Strength switching renders the expected chart titles.
- **Cold launch:** the existing configured Overview initial selection takes precedence over saved selections in this Storybook version. That baseline behavior remains; the final Squat deep link was checked again after cold launch. **iOS:** unavailable because `xcrun simctl` is missing.

Exact verification commands:

```sh
npm run test:once -- --runInBand .rnstorybook/tests/storyIndex.test.ts src/features/progress/view/stories/tests
npm run test:once -- --runInBand src/domain/progress src/features/progress/view src/shared/components/charts
npx tsc --noEmit
npm run lint
npx --no-install prettier --check .rnstorybook/index.tsx .rnstorybook/storyIndex.ts .rnstorybook/tests/storyIndex.test.ts src/features/progress/view/stories/algorithmScenario.fixtures.ts src/features/progress/view/stories/algorithmScenario.results.ts src/features/progress/view/stories/benchAlgorithm.fixtures.ts src/features/progress/view/stories/benchAlgorithm.results.ts src/features/progress/view/stories/BenchAlgorithm*.stories.tsx src/features/progress/view/stories/SquatAlgorithm.stories.tsx src/features/progress/view/stories/squatAlgorithm.fixtures.ts src/features/progress/view/stories/tests/benchAlgorithm.test.ts src/features/progress/view/stories/tests/squatAlgorithm.test.ts
git diff --check
npm run storybook -- --host localhost
adb devices
xcrun simctl list devices booted
```

Native selections use `rackriteapp://storybook?STORYBOOK_STORY_ID=…`: Squat IDs are `progress-algorithm-scenarios-squat-scenario-1--week-N-heavy` / `week-N-volume`; Bench IDs retain `progress-algorithm-scenarios-scenario-N--week-W-heavy` / `week-W-volume` / `week-W-technique`.
