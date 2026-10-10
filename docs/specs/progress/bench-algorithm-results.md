# Bench algorithm execution results — scenarios 1–9

These results execute the current RackRite analyzer against all 144 chronological checkpoints: 16 existing checkpoints and 128 added checkpoints. Each story renders the production Progress cards without overriding the status, evidence, diagnosis, recommendation, or benchmark.

Inputs come from the [eight-week scenario document](../../../rackrite_bench_8_week_algorithm_test_scenarios.md). The grouped `Week | Session | Sets | Reps | Weight (kg) | Stored RPE` comment tables are beside each scenario in [the fixtures](../../../src/features/progress/view/stories/benchAlgorithm.fixtures.ts). The source document remains unchanged.

## How to inspect a checkpoint

Run `npm run storybook:android` (or `npm run storybook` with an existing development client). Select **Progress → Algorithm scenarios → Bench → Scenario N → Week N · Session**. The Notes addon includes all inputs completed through that session, actual results, and winning estimated-max sources. Strength Now, Next Action, and Why show the strength, effort, workload, and consistency results.

## Execution rules and reading the tables

- All scenarios use Competition Bench only. Squat and deadlift deliberately have no history.
- Sessions finish at 18:00 local time, starting Monday, January 5, 2026: heavy Monday, volume Thursday, technique Saturday when present. Each checkpoint runs immediately after its session; “end of week” below means the final logged session, not Sunday midnight.
- Only RPE is floored: 7.5 → 7, 8.5 → 8, 6.5 → 6. Decimal weights remain unchanged. Missing RPE is null, shown as `—`.
- RPE below 7 counts toward workload but is excluded from both raw and adjusted strength representatives. Missing RPE permits raw Brzycki estimation. Effective repetitions must stay within the supported range (at most 10).
- An adjusted session representative must retain at least 95% of the best raw estimate in that session. This can prevent an easier backoff from supplying the adjusted estimate even when its unfiltered formula would be larger.
- Current estimated max is the strongest selected raw/adjusted session estimate across the latest three eligible performance days. It uses the analyzer's unfiltered comparison history; technique/deload workouts with no eligible performance do not consume these days. Equal retained representatives are all listed as winning sources.
- Status uses the six-week strength comparison, repeated directional support, and confirmation. That comparison can use matched reps/RPE bands or a formula fallback. Its basis differs from the formula supporting current estimated max.
- Effort is the matched/typical change used by the actual cards; typical recorded RPE change is listed separately. Neither is automatically evidence of a load increase. Negative effort means easier.
- Early effort comparisons can report `partial_rpe` even when every recorded set has RPE: both comparison halves must first contain at least three days with usable typical RPE and meet the coverage threshold. The reason code currently combines limited comparison history with incomplete RPE coverage.
- Workload comparisons exclude incomplete weeks. The current week is always partial at these session checkpoints. Unavailable measurements keep their actual reason codes; they are never replaced with zero.
- Estimates and differences are shown to 0.1 kg, changes to one decimal. Analysis retains unrounded values. Code identifiers are included so unexpected results can be traced to domain rules.

## What works and what needs investigation

| Scenario | Checkpoints | Final estimated max | Final status | Assessment |
| --- | ---: | ---: | --- | --- |
| 1: Steady progression — 2×/week | 16 | 122.7 kg | progressing | Progression detected |
| 2: Same load, lower RPE — 2×/week | 16 | 120.0 kg | plateaued | Easier same-load work is classified as plateaued |
| 3: True plateau — 2×/week | 16 | 116.5 kg | plateaued | Flat performance / plateau detected |
| 4: Gradual regression — 2×/week | 16 | 110.6 kg | stable | Regression detected earlier; final confirmation resets |
| 5: Deload and rebound — 2×/week | 16 | 121.8 kg | progressing | Rebound detected; deload cannot expire strength days |
| 6: Heavy + volume + technique — 3×/week | 24 | 122.7 kg | progressing | Three-session history handled; target withheld |
| 7: Low-frequency progression — 1×/week | 8 | 117.3 kg | progressing | Weekly progression handled |
| 8: Mixed / missing RPE fallback — 2×/week | 16 | 112.5 kg | progressing | Missing-RPE raw fallback handled |
| 9: RPE outlier sensitivity — 2×/week | 16 | 114.0 kg | plateaued | Outlier excluded; intended spike not exercised |

## Scenario 1 — Steady progression — 2×/week

Normal improving block. Load rises over time and some repeated loads become easier.

**Assessment:** Progression detected; the final estimate is 122.7 kg and the status is progressing. Whole-number RPE changes both values and winning sets compared with the source table.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 111.2 kg | 111.2 kg | 111.2 kg | 0.0 kg | W1 D1 Heavy: 105×1 @8 |
| 2 | 112.9 kg | 112.9 kg | 114.5 kg | 1.6 kg | W2 D1 Heavy: 105×1 @7 |
| 3 | 114.0 kg | 114.0 kg | 114.0 kg | 0.0 kg | W3 D1 Heavy: 95×4 @7 |
| 4 | 115.5 kg | 115.5 kg | 117.3 kg | 1.8 kg | W4 D1 Heavy: 107.5×1 @7 |
| 5 | 117.0 kg | 117.0 kg | 117.0 kg | 0.0 kg | W5 D1 Heavy: 97.5×4 @7 |
| 6 | 118.2 kg | 118.2 kg | 120.0 kg | 1.8 kg | W6 D1 Heavy: 110×1 @7 |
| 7 | 119.1 kg | 119.1 kg | 120.0 kg | 0.9 kg | W7 D1 Heavy: 100×4 @7 |
| 8 | 121.1 kg | 121.1 kg | 122.7 kg | 1.6 kg | W8 D1 Heavy: 112.5×1 @7 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 114.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 114.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 114.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 114.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 1 of 5 |
| W4 D2 Volume | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 2 of 5 |
| W5 D1 Heavy | 117.3 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 |
| W5 D2 Volume | 117.0 kg | effort_adjusted | stable | confirming_change / false | weak / 0 of 5 |
| W6 D1 Heavy | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 5 of 5 |
| W6 D2 Volume | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 0 of 5 |
| W7 D1 Heavy | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |
| W7 D2 Volume | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |
| W8 D1 Heavy | 122.7 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |
| W8 D2 Volume | 122.7 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |

### Why This Status and Performance Trend cards — every session

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
| W5 D1 Heavy | 1.9% / effort_adjusted | 0.5 RPE / typical | 0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | 4.2% / effort_adjusted | 0.5 RPE / typical | 0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | 4.7% / effort_adjusted | 0.5 RPE / typical | 0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 5.6% / matched_reps_rpe | 0.3 RPE / typical | 0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 4.3% / matched_reps_rpe | 0.5 RPE / typical | 0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 2.7% / matched_reps_rpe | 0.3 RPE / typical | 0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 4.1% / matched_reps_rpe | -0.3 RPE / typical | -0.3 RPE | 44.4% | 0.0% | 4.6% |
| W8 D2 Volume | 5.5% / matched_reps_rpe | -0.5 RPE / typical | -0.5 RPE | 44.4% | 0.0% | 4.6% |

### Next Action card — every session

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
| W5 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D1 Heavy | none / moderate / productive_training | continue_approach | repeat: 97.5×4 @7–8 (comparable_repeat) |
| W6 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy | none / strong / productive_training | continue_approach | repeat: 100×4 @7–8 (comparable_repeat) |
| W7 D2 Volume | none / strong / productive_training | continue_approach | repeat: 92.5×6 @7–8 (comparable_repeat) |
| W8 D1 Heavy | none / strong / productive_training | continue_approach | progress: 102.5×4 @7–8 (supported_progression) |
| W8 D2 Volume | none / strong / productive_training | continue_approach | repeat: 92.5×6 @7–8 (comparable_repeat) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 105×1 @8 |
| W1 D2 Volume | W1 D1 Heavy: 105×1 @8 |
| W2 D1 Heavy | W2 D1 Heavy: 105×1 @7 |
| W2 D2 Volume | W2 D1 Heavy: 105×1 @7 |
| W3 D1 Heavy | W2 D1 Heavy: 105×1 @7 |
| W3 D2 Volume | W3 D1 Heavy: 95×4 @7 |
| W4 D1 Heavy | W4 D1 Heavy: 107.5×1 @7 |
| W4 D2 Volume | W4 D1 Heavy: 107.5×1 @7 |
| W5 D1 Heavy | W4 D1 Heavy: 107.5×1 @7 |
| W5 D2 Volume | W5 D1 Heavy: 97.5×4 @7 |
| W6 D1 Heavy | W6 D1 Heavy: 110×1 @7 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @7 |
| W7 D1 Heavy | W7 D1 Heavy: 100×4 @7 |
| W7 D2 Volume | W7 D1 Heavy: 100×4 @7 |
| W8 D1 Heavy | W8 D1 Heavy: 112.5×1 @7 |
| W8 D2 Volume | W8 D1 Heavy: 112.5×1 @7 |

</details>

## Scenario 2 — Same load, lower RPE — 2×/week

The lifter deliberately keeps the weights fixed while those weights become easier.

**Assessment:** Status gap: the estimate rises from 113.1 to 120.0 kg, but the final status is plateaued. Matched load comparisons see no weight change within the selected RPE bands; effort improvement is shown separately and does not drive the status rule.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 113.1 kg | 113.1 kg | 113.1 kg | 0.0 kg | W1 D1 Heavy: 110×1 @9 |
| 2 | 114.8 kg | 114.8 kg | 116.5 kg | 1.7 kg | W2 D1 Heavy: 110×1 @8 |
| 3 | 114.8 kg | 114.8 kg | 116.5 kg | 1.7 kg | W3 D1 Heavy: 110×1 @8 |
| 4 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W4 D1 Heavy: 110×1 @8 |
| 5 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W5 D1 Heavy: 110×1 @8 |
| 6 | 118.2 kg | 118.2 kg | 120.0 kg | 1.8 kg | W6 D1 Heavy: 110×1 @7 |
| 7 | 118.2 kg | 118.2 kg | 120.0 kg | 1.8 kg | W7 D1 Heavy: 110×1 @7 |
| 8 | 120.0 kg | 120.0 kg | 120.0 kg | 0.0 kg | W8 D1 Heavy: 110×1 @7 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 113.1 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 113.1 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 3 of 5 |
| W4 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W5 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 |
| W5 D2 Volume | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 3 of 5 |
| W6 D1 Heavy | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 |
| W6 D2 Volume | 120.0 kg | effort_adjusted | stable | confirmed_trend / true | moderate / 3 of 5 |
| W7 D1 Heavy | 120.0 kg | effort_adjusted | stable | confirmed_trend / true | weak / 3 of 5 |
| W7 D2 Volume | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W8 D1 Heavy | 120.0 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |
| W8 D2 Volume | 120.0 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |

### Why This Status and Performance Trend cards — every session

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
| W5 D1 Heavy | 1.2% / effort_adjusted | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | 3.2% / effort_adjusted | -0.8 RPE / typical | -0.8 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | 1.2% / effort_adjusted | -0.5 RPE / matched | -1.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 1.5% / effort_adjusted | -1.0 RPE / matched | -1.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 0.0% / effort_adjusted | -1.0 RPE / matched | -1.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 0.0% / matched_reps_rpe | -1.0 RPE / matched | -1.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 0.0% / matched_reps_rpe | -1.0 RPE / matched | -0.8 RPE | -88.9% | 0.0% | 0.0% |
| W8 D2 Volume | 0.0% / matched_reps_rpe | -0.5 RPE / matched | -0.3 RPE | -88.9% | 0.0% | 0.0% |

### Next Action card — every session

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
| W5 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D2 Volume | none / moderate / — | continue_approach | repeat: 87.5×6 @7–8 (comparable_repeat) |
| W7 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W8 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 95×4 @7–8 (comparable_repeat) |
| W8 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 87.5×6 @7–8 (comparable_repeat) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 110×1 @9 |
| W1 D2 Volume | W1 D1 Heavy: 110×1 @9 |
| W2 D1 Heavy | W2 D1 Heavy: 110×1 @8 |
| W2 D2 Volume | W2 D1 Heavy: 110×1 @8 |
| W3 D1 Heavy | W2 D1 Heavy: 110×1 @8<br>W3 D1 Heavy: 110×1 @8 |
| W3 D2 Volume | W3 D1 Heavy: 110×1 @8 |
| W4 D1 Heavy | W3 D1 Heavy: 110×1 @8<br>W4 D1 Heavy: 110×1 @8 |
| W4 D2 Volume | W4 D1 Heavy: 110×1 @8 |
| W5 D1 Heavy | W4 D1 Heavy: 110×1 @8<br>W5 D1 Heavy: 110×1 @8 |
| W5 D2 Volume | W5 D1 Heavy: 110×1 @8 |
| W6 D1 Heavy | W6 D1 Heavy: 110×1 @7 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @7 |
| W7 D1 Heavy | W6 D1 Heavy: 110×1 @7<br>W7 D1 Heavy: 110×1 @7 |
| W7 D2 Volume | W7 D1 Heavy: 110×1 @7 |
| W8 D1 Heavy | W7 D1 Heavy: 110×1 @7<br>W8 D1 Heavy: 110×1 @7 |
| W8 D2 Volume | W8 D1 Heavy: 110×1 @7 |

</details>

## Scenario 3 — True plateau — 2×/week

Eight weeks of essentially unchanged performance with regular exposure.

**Assessment:** Flat performance detected: 116.5 kg throughout, stable after sufficient history, then confirmed plateaued in week 7. A plateau does not establish a physiological cause, so diagnosis is insufficient_evidence and the action is gather_evidence.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W1 D1 Heavy: 110×1 @8 |
| 2 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W2 D1 Heavy: 110×1 @8 |
| 3 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W3 D1 Heavy: 110×1 @8 |
| 4 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W4 D1 Heavy: 110×1 @8 |
| 5 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W5 D1 Heavy: 110×1 @8 |
| 6 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W6 D1 Heavy: 110×1 @8 |
| 7 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W7 D1 Heavy: 110×1 @8 |
| 8 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W8 D1 Heavy: 110×1 @8 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 3 of 5 |
| W4 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W5 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 3 of 5 |
| W5 D2 Volume | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W6 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 3 of 5 |
| W6 D2 Volume | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W7 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W7 D2 Volume | 116.5 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |
| W8 D1 Heavy | 116.5 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |
| W8 D2 Volume | 116.5 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |

### Why This Status and Performance Trend cards — every session

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
| W5 D1 Heavy | -1.7% / effort_adjusted | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | 0.0% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | -1.7% / effort_adjusted | 0.0 RPE / matched | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | 0.0% | 0.0% | 0.0% |
| W8 D2 Volume | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | 0.0% | 0.0% | 0.0% |

### Next Action card — every session

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
| W5 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 87.5×6 @7–8 (comparable_repeat) |
| W8 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 95×4 @7–8 (comparable_repeat) |
| W8 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 87.5×6 @7–8 (comparable_repeat) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 110×1 @8 |
| W1 D2 Volume | W1 D1 Heavy: 110×1 @8 |
| W2 D1 Heavy | W1 D1 Heavy: 110×1 @8<br>W2 D1 Heavy: 110×1 @8 |
| W2 D2 Volume | W2 D1 Heavy: 110×1 @8 |
| W3 D1 Heavy | W2 D1 Heavy: 110×1 @8<br>W3 D1 Heavy: 110×1 @8 |
| W3 D2 Volume | W3 D1 Heavy: 110×1 @8 |
| W4 D1 Heavy | W3 D1 Heavy: 110×1 @8<br>W4 D1 Heavy: 110×1 @8 |
| W4 D2 Volume | W4 D1 Heavy: 110×1 @8 |
| W5 D1 Heavy | W4 D1 Heavy: 110×1 @8<br>W5 D1 Heavy: 110×1 @8 |
| W5 D2 Volume | W5 D1 Heavy: 110×1 @8 |
| W6 D1 Heavy | W5 D1 Heavy: 110×1 @8<br>W6 D1 Heavy: 110×1 @8 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @8 |
| W7 D1 Heavy | W6 D1 Heavy: 110×1 @8<br>W7 D1 Heavy: 110×1 @8 |
| W7 D2 Volume | W7 D1 Heavy: 110×1 @8 |
| W8 D1 Heavy | W7 D1 Heavy: 110×1 @8<br>W8 D1 Heavy: 110×1 @8 |
| W8 D2 Volume | W8 D1 Heavy: 110×1 @8 |

</details>

## Scenario 4 — Gradual regression — 2×/week

A sustained decline: lower heavy loads and/or the same loads costing more RPE.

**Assessment:** Declining estimates are detected, with regressing checkpoints in weeks 6–7. Final-state gap: week 8 volume returns stable/confirming_change even though the estimate is 110.6 kg and the selected six-week strength comparison is negative. The comparison switches from the `effort_adjusted` fallback to `matched_reps_rpe` as three rep/RPE groups gain enough supporting days. This resets confirmation. The new comparison is −2.6%, within the stalling band rather than the −3% regression entry threshold; this checkpoint has not yet confirmed the new candidate status.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 119.1 kg | 119.1 kg | 120.0 kg | 0.9 kg | W1 D1 Heavy: 100×4 @7 |
| 2 | 119.1 kg | 119.1 kg | 120.0 kg | 0.9 kg | W2 D1 Heavy: 100×4 @7 |
| 3 | 117.4 kg | 117.4 kg | 119.1 kg | 1.7 kg | W3 D1 Heavy: 112.5×1 @8 |
| 4 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W4 D1 Heavy: 110×1 @8 |
| 5 | 114.8 kg | 114.8 kg | 116.5 kg | 1.7 kg | W5 D1 Heavy: 110×1 @8 |
| 6 | 113.1 kg | 113.1 kg | 113.1 kg | 0.0 kg | W6 D1 Heavy: 110×1 @9 |
| 7 | 112.2 kg | 112.2 kg | 113.8 kg | 1.6 kg | W7 D1 Heavy: 107.5×1 @8 |
| 8 | 110.6 kg | 110.6 kg | 110.6 kg | 0.0 kg | W8 D1 Heavy: 107.5×1 @9 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 120.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 120.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 120.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 120.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 120.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 119.1 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 119.1 kg | effort_adjusted | learning | insufficient_history / false | weak / 2 of 5 |
| W4 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 1 of 5 |
| W5 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 1 of 5 |
| W5 D2 Volume | 116.5 kg | effort_adjusted | stalling | confirmed_trend / true | weak / 0 of 5 |
| W6 D1 Heavy | 116.5 kg | effort_adjusted | stalling | confirmed_trend / true | weak / 0 of 5 |
| W6 D2 Volume | 113.1 kg | effort_adjusted | regressing | confirmed_trend / true | moderate / 5 of 5 |
| W7 D1 Heavy | 113.8 kg | effort_adjusted | regressing | confirmed_trend / true | strong / 5 of 5 |
| W7 D2 Volume | 113.8 kg | effort_adjusted | regressing | confirmed_trend / true | strong / 5 of 5 |
| W8 D1 Heavy | 113.8 kg | effort_adjusted | regressing | confirmed_trend / true | strong / 5 of 5 |
| W8 D2 Volume | 110.6 kg | effort_adjusted | stable | confirming_change / false | weak / 0 of 5 |

### Why This Status and Performance Trend cards — every session

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
| W5 D1 Heavy | -2.9% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | -2.8% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | -3.9% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | -5.5% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | -5.5% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | -4.5% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | -4.6% / effort_adjusted | 0.3 RPE / typical | 0.3 RPE | 12.5% | 0.0% | -3.0% |
| W8 D2 Volume | -2.6% / matched_reps_rpe | 0.5 RPE / typical | 0.5 RPE | 12.5% | 0.0% | -3.0% |

### Next Action card — every session

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
| W5 D2 Volume | insufficient_evidence / weak / uncertain_cause | monitor | unavailable (weak_evidence) |
| W6 D1 Heavy | insufficient_evidence / weak / uncertain_cause | monitor | unavailable (weak_evidence) |
| W6 D2 Volume | insufficient_evidence / weak / uncertain_cause | reassess | reduce_stress: 82.5×6 @7–8 (repeated_decline) |
| W7 D1 Heavy | insufficient_evidence / weak / uncertain_cause | reassess | reduce_stress: 90×4 @7–8 (repeated_decline) |
| W7 D2 Volume | insufficient_evidence / weak / uncertain_cause | reassess | reduce_stress: 82.5×6 @7–8 (repeated_decline) |
| W8 D1 Heavy | insufficient_evidence / weak / uncertain_cause | reassess | reduce_stress: 87.5×4 @7–8 (repeated_decline) |
| W8 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 100×4 @7 |
| W1 D2 Volume | W1 D1 Heavy: 100×4 @7 |
| W2 D1 Heavy | W1 D1 Heavy: 100×4 @7<br>W2 D1 Heavy: 100×4 @7 |
| W2 D2 Volume | W2 D1 Heavy: 100×4 @7 |
| W3 D1 Heavy | W2 D1 Heavy: 100×4 @7 |
| W3 D2 Volume | W3 D1 Heavy: 112.5×1 @8 |
| W4 D1 Heavy | W3 D1 Heavy: 112.5×1 @8 |
| W4 D2 Volume | W4 D1 Heavy: 110×1 @8 |
| W5 D1 Heavy | W4 D1 Heavy: 110×1 @8<br>W5 D1 Heavy: 110×1 @8 |
| W5 D2 Volume | W5 D1 Heavy: 110×1 @8 |
| W6 D1 Heavy | W5 D1 Heavy: 110×1 @8 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @9 |
| W7 D1 Heavy | W7 D1 Heavy: 107.5×1 @8 |
| W7 D2 Volume | W7 D1 Heavy: 107.5×1 @8 |
| W8 D1 Heavy | W7 D1 Heavy: 107.5×1 @8 |
| W8 D2 Volume | W8 D1 Heavy: 107.5×1 @9 |

</details>

## Scenario 5 — Deload and rebound — 2×/week

Four loading weeks, a deliberate low-fatigue week, then stronger training after the deload.

**Assessment:** Rebound detected, but the source document's deload dip does not occur: both deload sessions floor to RPE 6, contribute workload, and supply no performance days. They therefore do not advance the three-performance-day max window. End of week 5 stays 117.0 kg; the final estimate rebounds to 121.8 kg.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 111.2 kg | 111.2 kg | 111.2 kg | 0.0 kg | W1 D1 Heavy: 105×1 @8 |
| 2 | 114.0 kg | 114.0 kg | 114.0 kg | 0.0 kg | W2 D1 Heavy: 95×4 @7 |
| 3 | 115.5 kg | 115.5 kg | 117.3 kg | 1.8 kg | W3 D1 Heavy: 107.5×1 @7 |
| 4 | 116.5 kg | 116.5 kg | 117.0 kg | 0.5 kg | W4 D1 Heavy: 97.5×4 @7 |
| 5 | 115.7 kg | 115.7 kg | 117.0 kg | 1.3 kg | W4 D1 Heavy: 97.5×4 @7 |
| 6 | 118.2 kg | 118.2 kg | 120.0 kg | 1.8 kg | W6 D1 Heavy: 110×1 @7 |
| 7 | 119.1 kg | 119.1 kg | 120.0 kg | 0.9 kg | W7 D1 Heavy: 100×4 @7 |
| 8 | 120.0 kg | 120.0 kg | 121.8 kg | 1.8 kg | W8 D1 Heavy: 115×1 @8 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 114.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 114.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D2 Volume | 117.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 2 of 5 |
| W5 D1 Deload heavy | 117.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 2 of 5 |
| W5 D2 Deload volume | 117.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 2 of 5 |
| W6 D1 Heavy | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 1 of 5 |
| W6 D2 Volume | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 4 of 5 |
| W7 D1 Heavy | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 5 of 5 |
| W7 D2 Volume | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 3 of 5 |
| W8 D1 Heavy | 121.8 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 4 of 5 |
| W8 D2 Volume | 121.8 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 4 of 5 |

### Why This Status and Performance Trend cards — every session

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
| W5 D1 Deload heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Deload volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | 3.4% / effort_adjusted | -0.5 RPE / typical | -0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 3.4% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 4.1% / effort_adjusted | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 4.0% / effort_adjusted | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 3.7% / effort_adjusted | 0.3 RPE / typical | 0.3 RPE | -23.1% | 0.0% | -10.3% |
| W8 D2 Volume | 2.7% / effort_adjusted | 0.8 RPE / typical | 0.8 RPE | -23.1% | 0.0% | -10.3% |

### Next Action card — every session

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
| W5 D1 Deload heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W5 D2 Deload volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W6 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D2 Volume | none / moderate / productive_training | continue_approach | repeat: 90×6 @7–8 (comparable_repeat) |
| W7 D1 Heavy | none / moderate / productive_training | continue_approach | repeat: 100×4 @7–8 (comparable_repeat) |
| W7 D2 Volume | none / moderate / productive_training | continue_approach | repeat: 92.5×6 @7–8 (comparable_repeat) |
| W8 D1 Heavy | none / moderate / productive_training | continue_approach | progress: 102.5×4 @7–8 (supported_progression) |
| W8 D2 Volume | none / strong / productive_training | continue_approach | repeat: 92.5×6 @7–8 (comparable_repeat) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 105×1 @8 |
| W1 D2 Volume | W1 D1 Heavy: 105×1 @8 |
| W2 D1 Heavy | W2 D1 Heavy: 95×4 @7 |
| W2 D2 Volume | W2 D1 Heavy: 95×4 @7 |
| W3 D1 Heavy | W3 D1 Heavy: 107.5×1 @7 |
| W3 D2 Volume | W3 D1 Heavy: 107.5×1 @7 |
| W4 D1 Heavy | W3 D1 Heavy: 107.5×1 @7 |
| W4 D2 Volume | W4 D1 Heavy: 97.5×4 @7 |
| W5 D1 Deload heavy | W4 D1 Heavy: 97.5×4 @7 |
| W5 D2 Deload volume | W4 D1 Heavy: 97.5×4 @7 |
| W6 D1 Heavy | W6 D1 Heavy: 110×1 @7 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @7 |
| W7 D1 Heavy | W7 D1 Heavy: 100×4 @7 |
| W7 D2 Volume | W7 D1 Heavy: 100×4 @7 |
| W8 D1 Heavy | W8 D1 Heavy: 115×1 @8 |
| W8 D2 Volume | W8 D1 Heavy: 115×1 @8 |

</details>

## Scenario 6 — Heavy + volume + technique — 3×/week

Three exposures: a specific heavy day, a moderate-volume day, and an easy technique day.

**Assessment:** Progression detected with all 24 exposure checkpoints. Technique days with only RPE 6 remain workload-only; days containing RPE 7 can count as performance days. The max survives the lighter sessions and finishes at 122.7 kg. A final benchmark is withheld because the recent comparable exposures do not meet target-generation requirements.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 111.2 kg | 111.2 kg | 111.2 kg | 0.0 kg | W1 D1 Heavy: 105×1 @8 |
| 2 | 113.8 kg | 113.8 kg | 113.8 kg | 0.0 kg | W2 D1 Heavy: 107.5×1 @8 |
| 3 | 115.5 kg | 115.5 kg | 117.3 kg | 1.8 kg | W3 D1 Heavy: 107.5×1 @7 |
| 4 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W4 D1 Heavy: 110×1 @8 |
| 5 | 112.2 kg | 112.2 kg | 113.8 kg | 1.6 kg | W5 D1 Heavy: 107.5×1 @8 |
| 6 | 118.2 kg | 118.2 kg | 120.0 kg | 1.8 kg | W6 D1 Heavy: 110×1 @7 |
| 7 | 119.1 kg | 119.1 kg | 119.1 kg | 0.0 kg | W7 D1 Heavy: 112.5×1 @8 |
| 8 | 120.9 kg | 120.9 kg | 122.7 kg | 1.8 kg | W8 D1 Heavy: 112.5×1 @7 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W1 D3 Technique | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 113.8 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 113.8 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W2 D3 Technique | 113.8 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D1 Heavy | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D3 Technique | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 117.3 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 1 of 5 |
| W4 D3 Technique | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 1 of 5 |
| W5 D1 Heavy | 115.7 kg | effort_adjusted | stable | confirming_change / false | weak / 1 of 5 |
| W5 D2 Volume | 113.8 kg | effort_adjusted | stable | confirmed_trend / true | moderate / 2 of 5 |
| W5 D3 Technique | 113.8 kg | effort_adjusted | stable | confirmed_trend / true | moderate / 2 of 5 |
| W6 D1 Heavy | 120.0 kg | effort_adjusted | stable | confirmed_trend / true | moderate / 2 of 5 |
| W6 D2 Volume | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 |
| W6 D3 Technique | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 |
| W7 D1 Heavy | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 3 of 5 |
| W7 D2 Volume | 119.1 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 4 of 5 |
| W7 D3 Technique | 119.1 kg | effort_adjusted | stable | confirming_change / false | weak / 0 of 5 |
| W8 D1 Heavy | 122.7 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 4 of 5 |
| W8 D2 Volume | 122.7 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 4 of 5 |
| W8 D3 Technique | 122.7 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 3 of 5 |

### Why This Status and Performance Trend cards — every session

| Checkpoint | Strength change / trend basis | Effort change / basis | Typical RPE change | Hard sets change | Frequency change | Volume change |
| --- | --- | --- | --- | --- | --- | --- |
| W1 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W1 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W1 D3 Technique | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D3 Technique | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D3 Technique | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D2 Volume | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D3 Technique | unavailable (insufficient_history) / load_reps | -0.5 RPE / typical | -0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D1 Heavy | 1.8% / effort_adjusted | -0.5 RPE / typical | -0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | 1.2% / effort_adjusted | -0.5 RPE / typical | -0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D3 Technique | 1.2% / effort_adjusted | -0.5 RPE / typical | -0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | 1.8% / effort_adjusted | -0.5 RPE / typical | -0.5 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 2.7% / matched_reps_rpe | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D3 Technique | 2.7% / matched_reps_rpe | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 2.7% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 2.7% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D3 Technique | 2.3% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 5.1% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | 22.2% | 0.0% | 1.4% |
| W8 D2 Volume | 5.1% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | 22.2% | 0.0% | 1.4% |
| W8 D3 Technique | 4.5% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | 22.2% | 0.0% | 1.4% |

### Next Action card — every session

| Checkpoint | Diagnosis / evidence / reasons | Action | Benchmark or unavailable reason |
| --- | --- | --- | --- |
| W1 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W1 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W1 D3 Technique | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D3 Technique | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D3 Technique | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D3 Technique | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W5 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W5 D2 Volume | none / moderate / — | continue_approach | unavailable (comparable_exposures) |
| W5 D3 Technique | none / moderate / — | continue_approach | unavailable (comparable_exposures) |
| W6 D1 Heavy | none / moderate / — | continue_approach | unavailable (comparable_exposures) |
| W6 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D3 Technique | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy | none / moderate / productive_training | continue_approach | repeat: 97.5×4 @7–8 (comparable_repeat) |
| W7 D2 Volume | none / strong / productive_training | continue_approach | repeat: 92.5×6 @7–8 (comparable_repeat) |
| W7 D3 Technique | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W8 D1 Heavy | none / strong / productive_training | continue_approach | unavailable (comparable_exposures) |
| W8 D2 Volume | none / strong / productive_training | continue_approach | unavailable (comparable_exposures) |
| W8 D3 Technique | none / moderate / productive_training | continue_approach | unavailable (comparable_exposures) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 105×1 @8 |
| W1 D2 Volume | W1 D1 Heavy: 105×1 @8 |
| W1 D3 Technique | W1 D1 Heavy: 105×1 @8 |
| W2 D1 Heavy | W2 D1 Heavy: 107.5×1 @8 |
| W2 D2 Volume | W2 D1 Heavy: 107.5×1 @8 |
| W2 D3 Technique | W2 D1 Heavy: 107.5×1 @8 |
| W3 D1 Heavy | W3 D1 Heavy: 107.5×1 @7 |
| W3 D2 Volume | W3 D1 Heavy: 107.5×1 @7 |
| W3 D3 Technique | W3 D1 Heavy: 107.5×1 @7 |
| W4 D1 Heavy | W3 D1 Heavy: 107.5×1 @7 |
| W4 D2 Volume | W4 D1 Heavy: 110×1 @8 |
| W4 D3 Technique | W4 D1 Heavy: 110×1 @8 |
| W5 D1 Heavy | W4 D2 Volume: 90×6 @7 |
| W5 D2 Volume | W5 D1 Heavy: 107.5×1 @8 |
| W5 D3 Technique | W5 D1 Heavy: 107.5×1 @8 |
| W6 D1 Heavy | W6 D1 Heavy: 110×1 @7 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @7 |
| W6 D3 Technique | W6 D1 Heavy: 110×1 @7 |
| W7 D1 Heavy | W6 D1 Heavy: 110×1 @7 |
| W7 D2 Volume | W7 D1 Heavy: 112.5×1 @8 |
| W7 D3 Technique | W7 D1 Heavy: 112.5×1 @8 |
| W8 D1 Heavy | W8 D1 Heavy: 112.5×1 @7 |
| W8 D2 Volume | W8 D1 Heavy: 112.5×1 @7 |
| W8 D3 Technique | W8 D1 Heavy: 112.5×1 @7 |

</details>

## Scenario 7 — Low-frequency progression — 1×/week

A lower-frequency bench setup. The lifter still progresses, but each performance day is a week apart.

**Assessment:** Low-frequency progression detected. Three performance days span 14 days between the first and last session (three weekly exposures), not three consecutive calendar days. The week 3 single still wins at week 5, and the week 7 single still wins at week 8. Final estimate: 117.3 kg, progressing, with moderate evidence.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 105.9 kg | 105.9 kg | 105.9 kg | 0.0 kg | W1 D1 Heavy + backoff: 100×1 @8 |
| 2 | 108.5 kg | 108.5 kg | 108.5 kg | 0.0 kg | W2 D1 Heavy + backoff: 102.5×1 @8 |
| 3 | 110.1 kg | 110.1 kg | 111.8 kg | 1.7 kg | W3 D1 Heavy + backoff: 102.5×1 @7 |
| 4 | 111.2 kg | 111.2 kg | 111.8 kg | 0.6 kg | W3 D1 Heavy + backoff: 102.5×1 @7 |
| 5 | 111.2 kg | 111.2 kg | 111.8 kg | 0.6 kg | W3 D1 Heavy + backoff: 102.5×1 @7 |
| 6 | 113.8 kg | 113.8 kg | 113.8 kg | 0.0 kg | W6 D1 Heavy + backoff: 107.5×1 @8 |
| 7 | 115.5 kg | 115.5 kg | 117.3 kg | 1.8 kg | W7 D1 Heavy + backoff: 107.5×1 @7 |
| 8 | 116.5 kg | 116.5 kg | 117.3 kg | 0.8 kg | W7 D1 Heavy + backoff: 107.5×1 @7 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy + backoff | 105.9 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W2 D1 Heavy + backoff | 108.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W3 D1 Heavy + backoff | 111.8 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W4 D1 Heavy + backoff | 111.8 kg | effort_adjusted | learning | insufficient_history / false | weak / 1 of 4 |
| W5 D1 Heavy + backoff | 111.8 kg | effort_adjusted | learning | insufficient_history / false | weak / 3 of 5 |
| W6 D1 Heavy + backoff | 113.8 kg | effort_adjusted | stable | confirming_change / false | weak / 3 of 5 |
| W7 D1 Heavy + backoff | 117.3 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 4 of 5 |
| W8 D1 Heavy + backoff | 117.3 kg | effort_adjusted | progressing | confirmed_trend / true | moderate / 4 of 5 |

### Why This Status and Performance Trend cards — every session

| Checkpoint | Strength change / trend basis | Effort change / basis | Typical RPE change | Hard sets change | Frequency change | Volume change |
| --- | --- | --- | --- | --- | --- | --- |
| W1 D1 Heavy + backoff | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D1 Heavy + backoff | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D1 Heavy + backoff | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D1 Heavy + backoff | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D1 Heavy + backoff | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy + backoff | 2.6% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy + backoff | 3.8% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy + backoff | 4.0% / matched_reps_rpe | 0.0 RPE / typical | 0.0 RPE | 12.5% | 0.0% | 1.9% |

### Next Action card — every session

| Checkpoint | Diagnosis / evidence / reasons | Action | Benchmark or unavailable reason |
| --- | --- | --- | --- |
| W1 D1 Heavy + backoff | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D1 Heavy + backoff | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D1 Heavy + backoff | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D1 Heavy + backoff | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W5 D1 Heavy + backoff | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W6 D1 Heavy + backoff | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy + backoff | none / moderate / productive_training | continue_approach | repeat: 95×4 @7–8 (comparable_repeat) |
| W8 D1 Heavy + backoff | none / moderate / productive_training | continue_approach | repeat: 95×4 @7–8 (comparable_repeat) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy + backoff | W1 D1 Heavy + backoff: 100×1 @8 |
| W2 D1 Heavy + backoff | W2 D1 Heavy + backoff: 102.5×1 @8 |
| W3 D1 Heavy + backoff | W3 D1 Heavy + backoff: 102.5×1 @7 |
| W4 D1 Heavy + backoff | W3 D1 Heavy + backoff: 102.5×1 @7 |
| W5 D1 Heavy + backoff | W3 D1 Heavy + backoff: 102.5×1 @7 |
| W6 D1 Heavy + backoff | W6 D1 Heavy + backoff: 107.5×1 @8 |
| W7 D1 Heavy + backoff | W7 D1 Heavy + backoff: 107.5×1 @7 |
| W8 D1 Heavy + backoff | W7 D1 Heavy + backoff: 107.5×1 @7 |

</details>

## Scenario 8 — Mixed / missing RPE fallback — 2×/week

The lifter sometimes skips RPE. Missing RPE must use the raw formula instead of inventing effort.

**Assessment:** Missing-RPE fallback works: absent RPE stays null and uses the raw formula. End-of-week estimates drop to 107.5 kg in week 4 and 112.5 kg in week 8. The final trend can still be progressing because matched load/reps improved; this status and the latest-three-day estimated max measure different things. Effort comparisons can be unavailable when RPE coverage is insufficient.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 111.2 kg | 111.2 kg | 111.2 kg | 0.0 kg | W1 D1 Heavy: 105×1 @8 |
| 2 | 112.8 kg | 112.8 kg | 114.5 kg | 1.7 kg | W2 D1 Heavy: 105×1 @7 |
| 3 | 113.8 kg | 113.8 kg | 114.0 kg | 0.2 kg | W3 D1 Heavy: 95×4 @7 |
| 4 | 107.5 kg | 107.5 kg | 107.5 kg | 0.0 kg | W4 D1 Heavy: 107.5×1 @— |
| 5 | 116.5 kg | 116.5 kg | 117.0 kg | 0.5 kg | W5 D1 Heavy: 97.5×4 @7 |
| 6 | 118.2 kg | 118.2 kg | 120.0 kg | 1.8 kg | W6 D1 Heavy: 110×1 @7 |
| 7 | 119.1 kg | 119.1 kg | 120.0 kg | 0.9 kg | W7 D1 Heavy: 100×4 @7 |
| 8 | 112.5 kg | 112.5 kg | 112.5 kg | 0.0 kg | W8 D1 Heavy: 112.5×1 @— |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume (RPE omitted) | 111.2 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 114.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume (RPE omitted) | 114.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 114.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume (RPE omitted) | 114.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 114.0 kg | effort_adjusted | learning | insufficient_history / false | weak / 1 of 5 |
| W4 D2 Volume (RPE omitted) | 107.5 kg | load_reps | learning | insufficient_history / false | weak / 2 of 5 |
| W5 D1 Heavy | 117.0 kg | effort_adjusted | stable | confirming_change / false | weak / 0 of 5 |
| W5 D2 Volume (RPE omitted) | 117.0 kg | effort_adjusted | stable | confirming_change / false | weak / 2 of 5 |
| W6 D1 Heavy | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 1 of 5 |
| W6 D2 Volume (RPE omitted) | 120.0 kg | effort_adjusted | stable | confirming_change / false | weak / 0 of 5 |
| W7 D1 Heavy | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |
| W7 D2 Volume (RPE omitted) | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |
| W8 D1 Heavy | 120.0 kg | effort_adjusted | progressing | confirmed_trend / true | strong / 5 of 5 |
| W8 D2 Volume (RPE omitted) | 112.5 kg | load_reps | progressing | confirmed_trend / true | strong / 5 of 5 |

### Why This Status and Performance Trend cards — every session

| Checkpoint | Strength change / trend basis | Effort change / basis | Typical RPE change | Hard sets change | Frequency change | Volume change |
| --- | --- | --- | --- | --- | --- | --- |
| W1 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W1 D2 Volume (RPE omitted) | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W2 D2 Volume (RPE omitted) | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W3 D2 Volume (RPE omitted) | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D1 Heavy | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W4 D2 Volume (RPE omitted) | unavailable (insufficient_history) / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D1 Heavy | -0.4% / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume (RPE omitted) | 4.1% / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | 1.0% / load_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume (RPE omitted) | 5.4% / matched_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 2.6% / matched_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume (RPE omitted) | 2.6% / matched_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy | 4.7% / matched_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (partial_rpe) | 0.0% | 4.6% |
| W8 D2 Volume (RPE omitted) | 5.3% / matched_reps | unavailable (partial_rpe) / typical | unavailable (partial_rpe) | unavailable (partial_rpe) | 0.0% | 4.6% |

### Next Action card — every session

| Checkpoint | Diagnosis / evidence / reasons | Action | Benchmark or unavailable reason |
| --- | --- | --- | --- |
| W1 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W1 D2 Volume (RPE omitted) | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W2 D2 Volume (RPE omitted) | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W3 D2 Volume (RPE omitted) | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D1 Heavy | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W4 D2 Volume (RPE omitted) | insufficient_evidence / weak / uncertain_cause | gather_evidence | unavailable (learning) |
| W5 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W5 D2 Volume (RPE omitted) | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D2 Volume (RPE omitted) | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy | none / strong / productive_training | continue_approach | repeat: 100×4 @7–8 (comparable_repeat) |
| W7 D2 Volume (RPE omitted) | none / strong / productive_training | continue_approach | repeat: 92.5×6 @— (effort_headroom_unknown) |
| W8 D1 Heavy | none / strong / productive_training | continue_approach | repeat: 100×4 @— (effort_headroom_unknown) |
| W8 D2 Volume (RPE omitted) | none / strong / productive_training | continue_approach | repeat: 92.5×6 @— (effort_headroom_unknown) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 105×1 @8 |
| W1 D2 Volume (RPE omitted) | W1 D1 Heavy: 105×1 @8 |
| W2 D1 Heavy | W2 D1 Heavy: 105×1 @7 |
| W2 D2 Volume (RPE omitted) | W2 D1 Heavy: 105×1 @7 |
| W3 D1 Heavy | W2 D1 Heavy: 105×1 @7 |
| W3 D2 Volume (RPE omitted) | W3 D1 Heavy: 95×4 @7 |
| W4 D1 Heavy | W3 D1 Heavy: 95×4 @7 |
| W4 D2 Volume (RPE omitted) | W4 D1 Heavy: 107.5×1 @— |
| W5 D1 Heavy | W5 D1 Heavy: 97.5×4 @7 |
| W5 D2 Volume (RPE omitted) | W5 D1 Heavy: 97.5×4 @7 |
| W6 D1 Heavy | W6 D1 Heavy: 110×1 @7 |
| W6 D2 Volume (RPE omitted) | W6 D1 Heavy: 110×1 @7 |
| W7 D1 Heavy | W7 D1 Heavy: 100×4 @7 |
| W7 D2 Volume (RPE omitted) | W7 D1 Heavy: 100×4 @7 |
| W8 D1 Heavy | W7 D1 Heavy: 100×4 @7 |
| W8 D2 Volume (RPE omitted) | W8 D1 Heavy: 112.5×1 @— |

</details>

## Scenario 9 — RPE outlier sensitivity — 2×/week

Real-world logging noise: seven weeks look stable, then one set is logged with an unusually low RPE.

**Assessment:** The supplied stress test does not produce its intended spike under the app's rounding and eligibility rules. The week 8 single floors from RPE 6.5 to 6 and is excluded. Week 8 heavy retains week 7's 116.5 kg single; after week 8 volume, that older day expires and a 95×4 @7 backoff wins at 114.0 kg. Status stays plateaued. This fixture therefore tests exclusion/expiry, rather than sensitivity to an eligible low-RPE outlier.

### Weekly reference versus actual estimated max

“Fractional reference” independently recalculates the document's all-sets-qualified formula using the latest three source sessions and original fractional RPE. It helps distinguish source-table arithmetic differences from app eligibility/rounding differences.

| Week | Document | Fractional reference | Actual app | App − document | Winning source(s) with stored RPE |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W1 D1 Heavy: 110×1 @8 |
| 2 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W2 D1 Heavy: 110×1 @8 |
| 3 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W3 D1 Heavy: 110×1 @8 |
| 4 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W4 D1 Heavy: 110×1 @8 |
| 5 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W5 D1 Heavy: 110×1 @8 |
| 6 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W6 D1 Heavy: 110×1 @8 |
| 7 | 116.5 kg | 116.5 kg | 116.5 kg | 0.0 kg | W7 D1 Heavy: 110×1 @8 |
| 8 | 121.8 kg | 121.8 kg | 114.0 kg | -7.8 kg | W8 D1 Heavy (RPE outlier): 95×4 @7 |

### Lift Status card — every session

| Checkpoint | Estimated max | Max formula basis | Status | Reason / confirmed | Evidence / supporting days |
| --- | ---: | --- | --- | --- | --- |
| W1 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 1 |
| W1 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 2 |
| W2 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 3 |
| W2 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 4 |
| W3 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W3 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W4 D1 Heavy | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 3 of 5 |
| W4 D2 Volume | 116.5 kg | effort_adjusted | learning | insufficient_history / false | weak / 0 of 5 |
| W5 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 3 of 5 |
| W5 D2 Volume | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W6 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 3 of 5 |
| W6 D2 Volume | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W7 D1 Heavy | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W7 D2 Volume | 116.5 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |
| W8 D1 Heavy (RPE outlier) | 116.5 kg | effort_adjusted | stable | confirming_change / false | weak / 5 of 5 |
| W8 D2 Volume | 114.0 kg | effort_adjusted | plateaued | confirmed_trend / true | strong / 5 of 5 |

### Why This Status and Performance Trend cards — every session

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
| W5 D1 Heavy | -1.7% / effort_adjusted | -0.3 RPE / typical | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W5 D2 Volume | 0.0% / effort_adjusted | 0.0 RPE / typical | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D1 Heavy | -1.7% / effort_adjusted | 0.0 RPE / matched | -0.3 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W6 D2 Volume | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D1 Heavy | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W7 D2 Volume | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | unavailable (incomplete_period) | unavailable (incomplete_period) | unavailable (incomplete_period) |
| W8 D1 Heavy (RPE outlier) | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | 0.0% | 0.0% | 0.0% |
| W8 D2 Volume | 0.0% / matched_reps_rpe | 0.0 RPE / matched | 0.0 RPE | 0.0% | 0.0% | 0.0% |

### Next Action card — every session

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
| W5 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W6 D2 Volume | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D1 Heavy | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W7 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 87.5×6 @7–8 (comparable_repeat) |
| W8 D1 Heavy (RPE outlier) | none / weak / — | continue_approach | unavailable (weak_evidence) |
| W8 D2 Volume | insufficient_evidence / weak / uncertain_cause | gather_evidence | repeat: 87.5×6 @7–8 (comparable_repeat) |

<details>
<summary>Estimated-max source trace after every session</summary>

| Checkpoint | Winning retained source(s) |
| --- | --- |
| W1 D1 Heavy | W1 D1 Heavy: 110×1 @8 |
| W1 D2 Volume | W1 D1 Heavy: 110×1 @8 |
| W2 D1 Heavy | W1 D1 Heavy: 110×1 @8<br>W2 D1 Heavy: 110×1 @8 |
| W2 D2 Volume | W2 D1 Heavy: 110×1 @8 |
| W3 D1 Heavy | W2 D1 Heavy: 110×1 @8<br>W3 D1 Heavy: 110×1 @8 |
| W3 D2 Volume | W3 D1 Heavy: 110×1 @8 |
| W4 D1 Heavy | W3 D1 Heavy: 110×1 @8<br>W4 D1 Heavy: 110×1 @8 |
| W4 D2 Volume | W4 D1 Heavy: 110×1 @8 |
| W5 D1 Heavy | W4 D1 Heavy: 110×1 @8<br>W5 D1 Heavy: 110×1 @8 |
| W5 D2 Volume | W5 D1 Heavy: 110×1 @8 |
| W6 D1 Heavy | W5 D1 Heavy: 110×1 @8<br>W6 D1 Heavy: 110×1 @8 |
| W6 D2 Volume | W6 D1 Heavy: 110×1 @8 |
| W7 D1 Heavy | W6 D1 Heavy: 110×1 @8<br>W7 D1 Heavy: 110×1 @8 |
| W7 D2 Volume | W7 D1 Heavy: 110×1 @8 |
| W8 D1 Heavy (RPE outlier) | W7 D1 Heavy: 110×1 @8 |
| W8 D2 Volume | W8 D1 Heavy (RPE outlier): 95×4 @7 |

</details>

## Historical verification and existing baseline issues (before chart removal)

- `npm run test:once -- --runInBand src/features/progress/view/stories/tests/benchAlgorithm.test.ts`: **43 passed**. Covers source-set accuracy, integer RPE ingestion, comment-table/report consistency, session schedules and history prefixes, 144 unique story exports, independent numerical checkpoints, source tracing, and observed status gaps.
- `npm run test:once -- --runInBand src/domain/progress src/features/progress/view src/shared/components/charts`: **229 passed, 1 existing failure** across 14 suites. The failing assertion is `progress.viewModel.test.ts:286`, which expects “No change vs baseline” where production returns null.
- `npx tsc --noEmit`: the existing error remains at `progress.liftStatusCard.test.ts:73`, which references removed `performanceLabel`. No new type errors were reported.
- `npm run lint`: blocked because the existing installation lacks `eslint`. No tooling was installed to bypass this.
- Prettier checking passes for the edited bench TypeScript files; `git diff --check` passes.
- Direct comparison with the pre-edit fixture confirms that `steadyBenchWeeks`, `steadyBenchHistory`, and all `steadyBenchCheckpoints` (including complete analyzer snapshots) are unchanged.
- All **72 weekly fractional reference values** independently recalculate to the document's displayed values. App differences therefore come from its rounding, eligibility, representative selection, and performance-day window rules.
- **Android development client:** selected each scenario 2–9 final-session story and verified its rendered estimated max and status against this report. Verified scenario 6's technique Notes and 24-session checkpoint, scenario 8's missing-RPE Notes and 16-session checkpoint, and switching Strength → Effort → Workload → Strength. The missing-RPE effort view explains its unavailable comparison; the workload chart identifies incomplete weeks and missing RPE coverage.
- **iOS:** not verified; `simctl` is unavailable in this environment.
- No algorithm changes, unrelated fixes, dependencies, or schema changes were added. The execution tables come from actual domain analysis rather than invented card overrides.
