# RackRite Progress / Lift Intelligence — V1

Progress derives deterministic, offline analysis for competition squat, bench, and deadlift from SQLite. It describes recorded performance, provides one qualified explanation, and optionally offers a conservative benchmark. It never modifies workouts or templates.

This specification replaces the previous variation / PR / recent-session design. RPE is already logged and remains optional, with whole-number values. The reference is Stitch **Progress - Lift Intelligence (Calibrated Sync)**, project `12785761605413090483`, screen `6570ee2baa994872949ea4f2d334366f`.

## Screen and interaction

Keep the existing app header, typography, navigation, and dark visual system. Use 16 px gutters and gaps, 20 px card padding, 16 px corners, muted borders, and 4 px left accents. The named reference takes precedence over older guidance prohibiting borders. Selected segments and chart bars use `#2563EB`.

The order is:

1. Progress title and uppercase subtitle.
2. Squat / Bench / Deadlift selector; Bench initially selected. Each option has a distinct status glyph and accessible status text.
3. **Lift Status**: status, evidence level, explanation, six-week performance change, recent estimated 1RM, and analyzed-session count.
4. **Next Action**: qualified recommendation and optional integrated benchmark.
5. **Why This Status**: performance, estimated 1RM, typical recorded RPE, and weekly competition-volume changes; one diagnosis and a methods sheet.
6. Performance / E1RM / Volume selector; Performance initially selected.
7. **Performance Trend**: eight Monday-based weeks, including the incomplete current week.

All four cards use shared `SurfaceCard`. Both selectors use shared `SegmentedControl`. The shared `BarChart` has no Progress dependencies or charting-library dependency. History retains its error-notice export as an alias of shared `ErrorNotice`.

Estimates display up to one decimal place; benchmark loads up to two. Displayed negative zero is normalized. The current estimated 1RM is the median of the latest three available daily raw estimates, not an all-time PR. Fewer days are explicitly marked as early history. Unavailable metrics remain visible as `—` with reasons.

Evidence bars start at a central zero marker. Their full-scale ranges are ±10% performance/E1RM, ±2 RPE points, and ±50% volume. Graphical fills clamp at the edges while labels preserve actual changes. RPE and volume use neutral colors. Percentages are measured change, never confidence probabilities.

Chart heights have a true zero baseline. Performance is the weekly median of daily values divided by the comparison baseline, with baseline 100. A missing baseline leaves Performance unavailable; E1RM can still show early data. E1RM uses weekly median raw estimates; volume sums valid completed non-warmup competition work. Missing adjusted values remain missing. Pressing a bar reveals its date range and value, also available to accessibility services. The headline identifies a six-week comparison although eight weeks are drawn.

## Architecture and loading

`domain/progress` owns pure calculations and repository contracts. `data/repositories/progressRepository` performs one bounded joined read and `data/mappers/progressMappers` maps a minimal projection. Injected feature actions load and analyze all three families together. The controller handles lifecycle and async state; the view model owns copy, formatting, colors, and presentation.

One refresh supplies a coherent `ProgressOverview`. Switching lifts or metrics makes no database request or analytical recomputation. No provider, persisted analytics, schema, migration, index, or runtime dependency is introduced.

Refresh occurs on focus, foreground, explicit retry/pull-to-refresh, and local midnight while focused. Ordinary pending refreshes coalesce. Version and activity guards discard responses after blur, backgrounding, unmount, or a superseding request. Selection survives asynchronous results. Initial load uses the shared loader; initial failure is an error screen. Refresh retains the last snapshot. A refresh error visibly marks it outdated and hides benchmarks until a successful refresh. Errors never become Learning or Stable.

## History and eligibility

Read the preceding 24 local-calendar weeks through the analysis timestamp. The query joins completed workouts, exercise entries, built-in competition definitions, and left-joined sets; it retrieves all three families together. Bounds are inclusive. Empty exposures survive the left join. History summaries and their warmup/top-set rules remain unchanged.

Competition identity requires kind, origin, and family; a variation sharing the family is insufficient. Repeated entries of the same competition exercise merge by workout/family. Sets deduplicate by stable identity; conflicting duplicates and invalid ownership are excluded. Conflicting competition definitions withhold family performance. Domain ordering is deterministic and independent of row order. Invalid timestamps, future completion, or invalid workout chronology are excluded without hydrating a workout aggregate.

A volume-eligible set is completed, non-warmup, owned by the valid exposure, and has finite positive weight, positive integer repetitions, valid completion chronology, and finite volume. Warmups and unfinished sets are ordinary exclusions, not corrupt-record penalties. Malformed RPE removes the effort observation without removing otherwise valid performance.

## Performance estimates

V1 uses Brzycki for 1–10 repetitions:

`e1RM = weight × 36 / (37 − reps)`

A single returns its performed load. For recorded RPE 7–10, an optional heuristic adds estimated repetitions in reserve:

`effectiveReps = reps + 10 − RPE`

`adjustedPerformance = Brzycki(weight, effectiveReps)`

Effective repetitions must remain at most 10; unsupported values are not clamped. Known RPE below 7 contributes volume/effort context but not primary strength estimation. Missing RPE supports raw estimates. For 100 kg × 5, raw is 112.5 kg; adjusted at RPE 9/8/7 is approximately 116.1/120.0/124.1.

Raw and adjusted representatives are selected separately from working, top, and backoff sets with equal semantic eligibility. An adjusted candidate must have a raw estimate at least 95% of the session's raw best. Rank only that eligible adjusted pool. Ties resolve by exercise order, set order, entry identifier, and set identifier. Preserve the source set and workout timestamps/identifiers for explanations and benchmarks.

Multiple sessions on one local day contribute one median daily performance value. Status compares medians across days rather than counting every set or rewarding split workouts with extra status evidence.

Use adjusted comparisons only when both halves have at least three performance days, adjusted values on at least 80% of performance days, and at least 70% set RPE coverage. Otherwise compare raw values throughout. Never splice raw and adjusted series. Material opposing raw/adjusted trends produce Learning and withhold targets.

The [bench prediction study](https://pubmed.ncbi.nlm.nih.gov/7500624/) and [multiple-repetition prediction study](https://pubmed.ncbi.nlm.nih.gov/16937972/) support cautious use of repetition-based estimates. [RIR-based RPE research](https://pubmed.ncbi.nlm.nih.gov/26049792/) does not validate this exact combined formula or RackRite's classifier.

## Classification and evidence

All thresholds live in `progress.config.ts` and are conservative product defaults, not physiological laws.

| Rule | V1 default |
| --- | --- |
| Continuous context | Last 56 days of the current segment |
| Main comparison | Last 42 days ending on latest performance day; older/newer 21-day halves |
| Minimum classification | Six days, three in each half, spanning at least 21 days |
| Progressing | Change ≥2%; two of latest three ≥1% above baseline |
| Regressing | Change ≤−3%; two of latest three ≥2% below baseline |
| Neutral band | −1% through +1% |
| Plateau | Eight days spanning 42 days; six occupied weeks; no gap >14 days |
| Plateau block stability | Three consecutive 14-day blocks with at least two days each; medians within 1.5% |
| Segment reset / staleness | Gap >21 days / latest performance >21 days old |
| Confirmation | Two consecutive eligible daily checkpoints |
| Retention | Progressing above +0.5%; Regressing below −1%; Plateaued within ±1.5%, unless another state is confirmed |

Data sufficiency precedes regression, progression, plateau, stalling, and stable. Stalling requires persistent mild decline between −3% and −1%, or previously confirmed progress flattening: latest three-day median within ±1% of preceding three with main change below +2%. Stable is the non-alarm state while comparable candidates await confirmation. Insufficiency or a gap resets immediately; basis changes clear pending confirmation. Every refresh reconstructs status from history; no previous classification is persisted.

Evidence is separate from status and physiological diagnosis. Learning, conflicting signals, insufficient directional support, or >20% invalid completed non-warmup records produce Weak evidence. A confirmed pattern with two-of-three support and adequate quality can be Moderate. Strong requires at least 12 days across 42 days, regular exposures, ≥90% valid records, and four-of-five supporting days. Stable/plateau support means within ±2% of baseline. A representative-repetition median shift ≥3 caps evidence at Moderate. Missing RPE does not prevent strong evidence about recorded load/repetition performance. Shared raw/adjusted source data are not independent votes.

Evidence facts preserve measured changes, comparison windows, and supporting workout identifiers.

## Diagnosis and recommendations

Use one primary diagnosis, qualified as a hypothesis. Physiological diagnoses cannot exceed Moderate evidence.

Precedence: insufficient/ambiguous data; inconsistent exposures when continuity limits inference; fatigue; excessive intensity; insufficient stimulus; insufficient evidence. Progressing and unconcerning Stable normally have no diagnosis.

- **Fatigue:** flat/declining performance, adequate effort coverage, typical recorded RPE rising ≥0.5, and competition volume rising ≥20% across comparable complete weeks. Rising high-effort share or frequency can support the explanation. Improving performance contradicts it.
- **Excessive intensity:** flat/declining performance and ≥50% of recorded training sets at RPE 9–10 across at least three recent days with adequate coverage. Full fatigue criteria take precedence.
- **Insufficient stimulus:** persistent flat performance, adequate effort context without a competing stress pattern, and competition volume ≥20% lower or frequency ≥25% lower than the most recent qualifying productive non-overlapping six-week period in the read range. A productive period must meet normal sample requirements and improve ≥2%. Without that personal comparison, return Insufficient Evidence.
- **Inconsistent training:** gaps >14 days or at least two missing complete weeks among the last six; >21-day gaps restart the segment. Recorded gaps do not establish their cause.

Recommendations maintain improving training, acknowledge intentional maintenance, monitor comparable exposures when uncertain, rebuild consistency after gaps, or suggest qualified stress/workload reassessment. Plateau adjustments start with “If your goal is to improve this lift.” No complete workout is generated, and no accepted-intervention event, countdown, or compliance claim exists.

## Benchmark contract

“No defensible target” is a valid result. Eligibility requires non-Learning status, at least Moderate status evidence, no material conflict, and three comparable representative exposures on distinct days spanning at least seven days within the latest 21 days. The newest reference must be ≤14 days old. A familiar repetition count 2–6 must appear in at least three of the latest five representative days. Use the latest qualifying reference; withhold if its performance differs >5% from the median comparable references.

Load rules are centralized: total increment 2.5 kg; increases at most one step and 2.5%; reduced-stress targets 5–10% below reference. Changed loads round down to the increment. Repeated historical off-grid loads stay exact. Generated RPE ranges use whole numbers and never exceed 8.

Heavier work requires Progressing, no contradictory stress recommendation, latest RPE ≤7 within supported performance eligibility, and sufficient comparable adjusted estimates. Capacity is the median adjusted estimate of three comparable references. Invert Brzycki at RPE 8:

`load = capacity × (37 − (reps + 10 − targetRPE)) / 36`

Bound by capacity, one-step, and percentage limits before rounding and revalidation. Corroborated 100 kg × 3 at RPE 7 can support 102.5 kg × 3, RPE 7–8. RPE 8 normally repeats. Missing effort permits a corroborated repeat without a numeric RPE target. Stalling or uncertain plateau normally repeats. Confirmed regression, stress-reduction recommendations, or RPE 9–10 choose supported reductions or omit. Known effort reductions also respect the formula-derived RPE 7 load. If rounding exceeds the reduction band, or capacity is unsupported, omit.

The workout editor's existing `[2.5, 5, 10]` quick increments derive from the shared settings constant; editor behavior and whole-number RPE remain unchanged.

## Validation and limitations

Colocated Jest suites cover formulas, eligibility and malformed data, status reconstruction, coverage, conflicting signals, benchmark constraints, mapper behavior, actual Drizzle-generated SQL through in-memory SQLite, actions, reducer/controller lifecycle races, view models, selectors, chart geometry, sheet dismissal, and local-calendar boundaries. The SQLite test adapter uses Node's built-in SQLite and the installed Drizzle proxy; it is test-only and requires a compatible Node version (validated with Node 24).

Run `npm run test:once -- --runInBand`, `npx tsc --noEmit`, and `npm run lint`. Separately smoke-test the native Expo SQLite adapter and compare rendered cards with the named Stitch screen. Missing lint tooling must be reported rather than installed solely for verification. Pre-existing failures in History paging, exercise-order geometry, and missing unrelated modules must remain visible in verification reporting.

### Implementation verification — 2026-09-10

- Full Jest run: **377 passed, 11 failed**, across 49 suites. All **127 new tests** passed. The unchanged failures are ten History paging assertions and one exercise-order auto-scroll geometry assertion. Existing History card/view-model tests pass.
- `npx tsc --noEmit`: only the four baseline missing-module diagnostics (`smokeTestWorkoutRepository` and `@/hooks/use-theme`); no new diagnostics.
- `npm run lint`: unavailable because `eslint` is missing; no tooling was installed.
- Calendar suite also passed with `TZ=Europe/Sofia` and `TZ=America/New_York`. `git diff --check` passed.
- Android Expo development build: the actual native SQLite read and analysis completed in 27.6 ms in one instrumented emulator refresh (development mode, existing local data; not a release-performance guarantee). The production route loaded without React Native errors.
- Compared native empty and populated states with the named Stitch reference. Verified a generated 102.5 kg × 3 / RPE 7–8 target, honest eight-bar heights, accessible bar value selection, Android Back dismissal of the methods sheet, and wrapping at 130% font scale with a 360 dp viewport. Existing bottom-navigation labels truncate at this large-text setting; navigation was not redesigned.
- Populated visual checks used a temporary in-memory history fixture. Fixture wiring and timing logs were removed; saved workouts were not changed. Emulator font scale and density were restored. iOS was not run because local simulator tooling was unavailable.

Calibration against real longitudinal training remains future work. Formula estimates cannot distinguish technique changes, deliberately easy work, bodyweight changes, inaccurate RPE, or maintenance goals. Competition volume excludes variation/accessory stress. The bounded read is not lifetime history. Strong observed-pattern evidence is not strong causal evidence. Load increments do not imply knowledge of available equipment. Benchmarks do not imply acceptance or completion.

Deferred: variation/accessory analysis, full program generation, equipment/units settings, maximal-single targets, half-step RPE, persisted interventions, training-block models, AI-generated explanations, automatic workout changes, monetization, and unrelated typography/navigation changes.
