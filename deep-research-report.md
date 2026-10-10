# RackRite Progress: Deep Research and Product Blueprint for a Best-in-Class Powerlifting Progress System

## Executive conclusion

After auditing RackRite's current progress implementation, reviewing the research on strength monitoring and autoregulation, examining how current lifting apps handle progress, and looking at recurring questions raised by powerlifters, my main conclusion is:

> **RackRite should not become an app with more progress charts. It should become a deterministic powerlifting decision engine.**

The Progress screen should answer four questions, in this order:

| Question | What the lifter actually wants to know |
|---|---|
| **Am I stronger?** | Is squat, bench, or deadlift capacity genuinely improving, or is this just normal session-to-session noise? |
| **How sure are we?** | Is there enough comparable training evidence to believe the trend? |
| **What changed?** | Did performance improve at the same effort? Is effort rising? Has exposure or workload changed? Is there a fatigue-compatible pattern? |
| **What do I do next?** | Add 2.5 kg? Repeat the load? Change reps? Back off? Keep doing exactly what I am doing? |

That is a much more valuable product than **e1RM + volume + charts**.

Powerlifting is ultimately judged by maximal force production in the squat, bench press, and deadlift, while training usually relies on repeated submaximal exposures rather than constant 1RM testing. citeturn9view4turn9view13 RPE/RIR is particularly valuable here: studies in powerlifters show strong relationships between RPE and relative load, and experienced powerlifters can select loads to prescribed RPE with reasonably small errors. citeturn10search0turn10search7turn9view2

That creates exactly the product opportunity RackRite can own:

**“Tell me whether my competition lifts are actually improving without making me max out, explain the evidence, and give me the next logical target.”**

Everything can remain deterministic. No LLM. No AI coach. No black-box recommendation.

And importantly, RackRite already has an unusually good foundation for doing this.

Your current system is **much better internally than the current Progress screen makes it appear**.

---

## What RackRite already gets right

I audited the uploaded repository rather than evaluating the UI only from your description.

The current domain architecture is:

`history → performance → sessions → trends → status → evidence → diagnosis → recommendation → benchmark → analysis`

That is exactly the right conceptual architecture for a serious progress system.

The strongest thing about RackRite today is that you are **already resisting many of the mistakes normal workout trackers make**.

### Your current analytical engine is already strong

In `src/domain/progress/progress.config.ts`, you currently use:

- 24 weeks of bounded history.
- A 42-day strength-trend period.
- A 56-day context period.
- Six minimum distinct performance days and at least 21 days of span before stronger conclusions.
- Separate thresholds for progress, regression, neutrality, status confirmation and status exit.
- Six-week plateau requirements rather than declaring a plateau from two poor sessions.
- Reset behavior after long gaps.
- Evidence strength based on data quantity, span, support, validity, repetition shifts and gaps.
- Optional RPE-adjusted performance.
- Workload and RPE context for fatigue-like patterns.
- Conservative next-benchmark generation rather than endlessly adding weight.

Most importantly, the file itself explicitly labels these values:

> `Product heuristics, not calibrated physiological thresholds.`

That is excellent product engineering. You are not pretending that a +2% threshold is a physiological law.

### Your e1RM implementation is appropriately bounded

RackRite currently uses the **Brzycki** formula:

\[
e1RM = weight \times \frac{36}{37-reps}
\]

and only permits it up to 10 repetitions.

That is a sensible safeguard. Generic repetitions-to-1RM relationships are imperfect because the number of repetitions an athlete can perform at a percentage of 1RM differs between athletes and training backgrounds. citeturn10search3 Therefore, treating e1RM as an estimate rather than truth is exactly correct.

Your RPE-adjusted calculation effectively uses:

\[
effectiveReps = reps + (10-RPE)
\]

followed by the same Brzycki equation.

Conceptually, that means:

**120 × 3 @10** and **120 × 3 @8** should not represent the same capacity.

That is directionally correct and highly relevant to powerlifting. StrengthLog explicitly promotes this same user problem: doing the same weight on two occasions can still represent progress if the later set has lower RPE. citeturn9view8 RPE-based loading is also supported as a practical autoregulatory tool; in an eight-week study, both percentage-based and RPE-based loading improved squat and bench strength. citeturn10search1

### You already have anti-noise mechanisms

RackRite does several subtle things well:

It collapses same-day performance into a daily value rather than letting somebody artificially influence the trend by doing multiple sessions.

It uses medians rather than simply taking the single best number.

It compares the earlier and later portions of the six-week window.

It requires repeated directional support before changing status.

It uses hysteresis-like exit thresholds so a lift does not jump continuously between **progressing** and **stable** because of tiny changes.

It requires prolonged flatness before declaring a plateau.

Those are excellent choices.

### Your recommendations are appropriately cautious

Your benchmark engine currently avoids giving a target when evidence is weak, stale or conflicting. It seeks recent, repeatedly performed rep ranges, typically 2–6 reps, and can:

**increase**, **repeat**, or **reduce stress**.

A progression recommendation is constrained by current effort and approximately one normal weight increment rather than saying, for example, “your e1RM increased 4%, therefore add 4% next session.”

This is exactly the philosophy I would preserve.

### The current Progress UI is underselling the backend

Your current `ProgressScreenView.tsx` essentially renders:

**Lift selector → Lift status → Next action → Why this status → Performance/E1RM/Volume toggle → chart**

This is logically coherent.

But it does not yet communicate the depth of your underlying model.

And more importantly, it does not yet answer the user's hardest questions with enough specificity.

That is where the opportunity lies.

---

## The actual progress problems powerlifters need solved

There is no credible research paper that ranks “powerlifting app pain points” from most to least painful, so I would not pretend there is one. The ranking below is my synthesis of powerlifting research, monitoring literature, competitor behavior, and recurring community questions. Community discussions are useful here as qualitative evidence, not prevalence data.

### The biggest problem is separating real strength progress from noise

A powerlifter does not actually care whether today's calculated e1RM is 181.4 kg instead of 179.7 kg.

They care:

> **“Am I actually getting stronger?”**

Strength performance varies between sessions. Rep ranges change. RPE changes. Program phases change. One day might involve 180 × 3 @8, another 170 × 5 @8.5, another 190 × 1 @7.

A raw graph asks the lifter to interpret all of that.

RackRite should perform the interpretation.

This is particularly important because powerlifters do not need to test a true maximum frequently to monitor capacity. One representative community question captures the problem directly: the lifter did not want to test 1RM repeatedly because of the fatigue/cost and asked how to know what percentages to use from submaximal work. citeturn9view13

That user is almost a perfect RackRite Pro customer.

### The second problem is comparing performances that are not directly comparable

Consider these bench sessions:

| Week | Top set |
|---|---:|
| A | 120 × 4 @9 |
| B | 120 × 4 @8 |
| C | 122.5 × 3 @8 |
| D | 125 × 2 @7.5 |

A generic logger presents four workouts.

An e1RM formula produces four estimates.

A good powerlifting progress system asks:

**Did the athlete lift more at the same reps and effort?**

**Did the same weight and reps become easier?**

**Are multiple different indicators agreeing that capacity improved?**

Research strongly supports preserving this individual context. RPE is strongly related to relative load in competitive powerlifters, but individual load-RPE/load-velocity relationships tend to fit better than generalized relationships. citeturn9view2 Traditional rep-percentage relationships also differ between athlete populations. citeturn10search3

That means a generic formula should be a **fallback/secondary metric**, not the sole truth source.

### The third problem is knowing what weight to use next

This is arguably the strongest subscription feature.

Logging applications are very good at answering:

> “What did I lift last time?”

The premium problem is:

> **“What should I attempt this time?”**

Powerlifters can use RPE effectively to select training loads. In one study of competitive powerlifters, mean absolute error around prescribed RPE was only around one-third of an RPE unit across the tested conditions, although accuracy differed somewhat by exercise and set type. citeturn10search7

That means RackRite has enough information from:

**load + reps + RPE + history**

to make deterministic, conservative recommendations such as:

> **Bench next benchmark**  
> 122.5 kg × 3 @ RPE 7–8  
> **+2.5 kg from your established 120 × 3 benchmark**  
> Your last three comparable exposures were above baseline without higher effort.

That is dramatically more useful than:

> “Your estimated 1RM increased 2.4%.”

### The fourth problem is understanding a stall

“Bench has not improved” is not enough.

The immediate next question is:

> **Why?**

But RackRite needs extreme discipline here.

With your present dataset, the app cannot know true physiological causation.

It *can* detect observable patterns:

| Pattern | What RackRite can safely say |
|---|---|
| Performance ↓ + RPE ↑ + workload ↑ | “Higher-stress / fatigue-compatible pattern” |
| Performance flat + repeated RPE 9–10 work | “High-effort pattern” |
| Performance flat + reduced exposure/work vs a previously productive period | “Lower-stimulus pattern” |
| Long gaps between exposures | “Inconsistent exposure” |
| Performance flat despite consistent exposure | “Confirmed plateau” |
| One poor workout | **Nothing definitive** |

That language distinction matters tremendously.

The app should not say:

> **“You are fatigued.”**

It should say:

> **“Your recent pattern is consistent with accumulated fatigue: performance is down while effort and recorded competition-lift workload are up.”**

Your existing code actually has the right philosophy here—diagnoses are already closer to hypotheses—but the UI should make that extremely explicit.

### The fifth problem is seeing progress without chasing PRs

Powerlifting culture naturally emphasizes personal records, but productive training cannot require a lifetime PR every week.

Research on RIR estimation shows people become considerably better at estimating repetitions remaining as they get closer to failure; estimation error was around one repetition when 0–5 reps remained and larger when much further from failure. citeturn10search4 RPE/RIR therefore gives RackRite an important way to recognize “quiet PRs”:

**same 160 × 3, but @7.5 instead of @9**

is valuable progress.

So is:

**180 × 1 @7 instead of 180 × 1 @8.5.**

So is:

**the same e1RM across four sessions with substantially lower effort.**

These are exactly the forms of improvement that generic PR systems often undersell.

### The sixth problem is understanding training stress without confusing volume with progress

Your current tonnage calculation:

\[
Volume = \sum(weight \times reps)
\]

is mathematically correct.

But it should **not be treated as a major progression outcome**.

Ten thousand kilograms of squat tonnage is not inherently better than eight thousand kilograms.

Volume can increase because:

- more sets were done,
- repetitions increased,
- weight increased,
- the program entered a volume block,
- the athlete became stronger,
- or the athlete simply accumulated unnecessary work.

Powerlifting programs also contain substantial non-competition work. A recent survey found that over 97.5% of surveyed powerlifters included exercise variations in addition to the competition lifts, alongside accessory exercises. citeturn9view5

RackRite currently restricts Progress workload to completed built-in competition squat/bench/deadlift sets.

That is safe—but it means the UI should call this:

> **Competition-lift workload**

not “training workload” or “total stimulus.”

Otherwise the app risks concluding that squat stimulus fell even while a lifter moved from competition squats toward pause squats and tempo squats.

### The seventh problem is knowing whether a bad period is a problem at all

Powerlifting programming often intentionally changes volume and intensity across blocks, and peaking/tapering deliberately alters training stress before competition. The literature on powerlifting tapering describes substantial reductions in volume while preserving relatively high intensity before a meet. citeturn9view4

RackRite currently has no meet date, training phase or intent in its progress schema.

So a future version should understand:

**development block → strength block → peak → taper → meet**

But this is **not the next thing I would build**.

You can make the current Progress experience exceptional before adding this.

---

## Where the current Progress screen still falls short

The problem is not that your current screen lacks enough statistics.

It is that several of the existing statistics answer nearly the same question, while several much more important questions are absent.

### Performance and e1RM are currently too redundant

Right now the UI can show:

- Performance
- Estimated 1RM
- Volume

But when RPE coverage is absent, “Performance” is fundamentally based on an e1RM estimate too.

So from the user's point of view:

> Performance trend  
> e1RM trend

can feel like two versions of the same thing.

A stronger hierarchy would be:

| Current | Better role |
|---|---|
| Performance | **Comparable Strength** |
| e1RM | **Estimated Strength** |
| Volume | **Training Context** |
| Missing | **Effort Trend** |
| Missing | **Consistency / Exposure** |
| Missing | **PRs and milestones** |

### Brzycki cannot be your best progress detector

The current Brzycki implementation is fine as an estimate.

But imagine:

**Week A:** 180 × 1 @7  
**Week B:** 170 × 4 @8

Changing rep schemes may move the estimated 1RM even when the athlete's actual capacity did not change equivalently.

The research problem is fundamental: generalized rep-to-%1RM tables do not perfectly describe every athlete, and individual RPE relationships are stronger than generalized ones. citeturn10search3turn9view2

Therefore RackRite's strongest measurement should become:

> **Comparable performance first; equation-derived performance second.**

### The app needs an explicit “same effort” progress system

This is probably the single highest-impact analytical addition.

Right now you adjust e1RM using RPE.

That is useful.

But the UI should explicitly recognize:

> **120 × 3 @7.5 today beats 120 × 3 @9 from six weeks ago.**

StrengthLog already communicates this concept publicly as a benefit of RPE-aware e1RM. citeturn9view8

RackRite should go further and make it a first-class deterministic metric.

Call it something understandable such as:

**Comparable Strength**

not a branded mystery score.

### The three lifts should be visible simultaneously

Your current segmented selector shows Squat / Bench / Deadlift, but the user must select each lift to understand its state.

For a powerlifter, the first thing Progress should show is:

| SQUAT | BENCH | DEADLIFT |
|---|---|---|
| **↑ +3.2%** | **→ +0.4%** | **↓ -2.6%** |
| Progressing | Stable | Stalling |
| Strong evidence | Strong | Moderate |

This alone would dramatically improve the information architecture.

The user opens Progress and understands their entire powerlifting trajectory in approximately two seconds.

Then tapping Bench expands Bench.

### The current “Why?” card does not yet explain enough

Today the screen gives:

- performance,
- estimated 1RM,
- typical RPE change,
- weekly competition volume.

I would change this conceptually to:

> **WHY BENCH IS STALLING**

**Comparable strength**  
→ No meaningful improvement across the last 5 comparable exposures.

**Effort**  
↑ Typical RPE +0.7.

**Hard work**  
↑ RPE 9+ sets from 23% → 51%.

**Exposure**  
✓ 2.4 bench sessions/week, no major gaps.

Then:

> **Interpretation:**  
> Your strength trend is flat while effort is rising. This is a higher-stress pattern, not an exposure problem.

That tells the lifter something.

### The weekly bar chart is not the best primary strength visualization

A bar chart is useful for weekly volume.

For strength capacity, I would strongly prefer:

**session dots + a robust trend line + baseline band**

because the user should see:

- actual training observations,
- normal variance,
- underlying direction.

For example:

```text
Bench strength

185 |                         ●
182 |                ●   ●───────
179 |       ●   ●────
176 |  ●────
    +------------------------------
      Aug       Sep       Oct

      +3.1% / 6 weeks
```

The “line” is not meant to imply perfect continuous physiological change. It simply communicates the estimated underlying direction more naturally than eight independent weekly bars.

### The recommendation needs its reasoning attached to it

You already produce a benchmark.

That should become the hero feature.

Instead of:

> Next action  
> Increase load

show:

> **NEXT BENCHMARK**  
> **122.5 kg × 3 @ RPE 7–8**  
> ↑ +2.5 kg
>
> **Why:** You completed 120 × 3 within the target effort range across 3 recent exposures and your strength trend remains positive.
>
> **Confidence: Strong**

Or:

> **NEXT BENCHMARK**  
> **Repeat 120 kg × 3 @ RPE 7–8**
>
> **Why:** Strength remains stable, but the last two exposures were harder. More evidence is needed before adding load.

Or:

> **NEXT BENCHMARK**  
> **115 kg × 3 @ RPE 7–8**
>
> ↓ Reduce stress
>
> **Why:** Performance declined while typical RPE and recorded competition-lift workload increased.

That is a subscription-worthy output.

### There is one subtle benchmark-selection issue worth revisiting in the code

From the current benchmark/reference logic, RackRite appears to select a **qualifying rep bucket** rather than explicitly ranking all qualifying buckets for reliability.

For Pro-quality progression, the reference rep target should be selected deterministically by something like:

\[
ReferenceScore =
w_1(ObservationCount)
+
w_2(Recency)
+
w_3(Span)
-
w_4(Dispersion)
\]

or, even more simply, sort by:

**most recent reliable → most observations → lowest variation**.

You do not want an arbitrary first-qualifying rep pattern to determine the next benchmark when another rep pattern has substantially better evidence.

---

## The deterministic progress engine I would build

This is the heart of the recommendation.

Do **not** replace your existing status system.

Build a stronger measurement layer beneath it.

### Make Comparable Strength the primary signal

For every competition lift, transform sets into observations:

\[
O_i = (date,\ weight,\ reps,\ RPE)
\]

Use only:

- completed competition-lift sets,
- non-warmups,
- valid loads/reps,
- preferably 1–6 reps for the highest-quality strength comparison,
- valid RPE where available.

Then create comparable buckets.

For RPE users:

\[
bucket = (reps,\ RPEBand)
\]

For example:

- 1 rep @ 7–8
- 1 rep @ 8–9
- 2 reps @ 7–8
- 3 reps @ 7–8
- 3 reps @ 8–9
- etc.

I would initially use **1.0-RPE-wide bands** rather than extremely narrow 0.5 bands because narrow buckets will fragment the data too aggressively.

Suppose the athlete has:

**Earlier period**

120 × 3 @7.5  
120 × 3 @8  
122.5 × 3 @8

**Recent period**

125 × 3 @7.5  
125 × 3 @8  
127.5 × 3 @8

Then:

\[
ComparableChange_b =
100\times
\left(
\frac{MedianRecentWeight_b}
{MedianBaselineWeight_b}
-1
\right)
\]

This is beautifully interpretable.

If the median comparable bench load moves from 120 to 125:

\[
100\times(\frac{125}{120}-1)
=
4.17\%
\]

No 1RM formula needed.

The app can say:

> **Comparable 3-rep strength: +4.2%**

That is stronger evidence than saying:

> “Brzycki says your e1RM changed.”

When several comparable rep/RPE buckets exist, combine them using a **weighted median**, where stronger buckets receive higher weight from observation count, recency and data quality.

Do not average tonnage into this score.

### Use an explicit fallback hierarchy

RackRite should choose the best available evidence, not force every athlete through the same equation.

I recommend:

\[
PrimaryStrengthSignal =
\begin{cases}
MatchedRepRPETrend, & \text{adequate matched RPE data}\\
MatchedRepTrend, & \text{adequate matching without RPE}\\
RPEAdjustedE1RMTrend, & \text{adequate RPE coverage}\\
RawE1RMTrend, & \text{otherwise}
\end{cases}
\]

Then tell the user which basis is active.

For example:

> **Strength trend: +3.4%**  
> Based on comparable 3–5 rep sets at similar RPE.

versus:

> **Strength trend: +3.4%**  
> Estimated from load and reps; RPE data is limited.

That transparency is extremely valuable.

### Keep e1RM, but demote it from “truth” to “capacity estimate”

e1RM remains useful because it allows comparisons across different rep ranges.

It should stay.

I would label it:

> **Estimated max**

and perhaps show:

> **181 kg**  
> +4 kg in 6 weeks

rather than attaching excessive decimals.

The user does not benefit from 181.37 kg.

The literature supports using RPE to inform loading and estimate relative intensity, but individual relationships outperform generalized ones. citeturn10search0turn9view2 Therefore RackRite should deliberately communicate estimation uncertainty rather than displaying false precision.

### Add a dedicated Effort Trend

Calculate:

\[
EffortChange =
Median(RPE_{recent}) - Median(RPE_{baseline})
\]

But preferably do this on comparable work.

A much better metric is:

\[
MatchedEffortChange =
Median(RPE_{recent} - RPE_{historical})
\]

for sets where:

- reps match,
- load is identical or within approximately one plate increment / a narrow percentage band.

Then RackRite can detect:

> 180 × 2 used to average RPE 8.8.  
> It now averages RPE 7.9.

\[
\Delta RPE=-0.9
\]

That is meaningful progression even with no weight change.

This directly addresses a real weakness of basic PR systems and aligns with the rationale behind RPE-aware strength tracking. citeturn9view8

### Add a PR lattice instead of one PR type

Generic trackers already provide multiple records. Hevy tracks heaviest weight, best weight at rep targets, projected/true 1RM, best set volume and session volume. citeturn9view6 StrengthLog tracks PRs across exercises and rep counts. citeturn11search1

RackRite needs at least as much—but powerlifting-specific.

I would detect:

| PR type | Example |
|---|---|
| **Heaviest weight** | New 200 kg deadlift |
| **Rep PR** | Best ever 180 × 4 |
| **Estimated strength PR** | New 214 kg e1RM |
| **Effort PR** | 180 × 3 @7.5 versus prior @8.5 |
| **Submaximal single PR** | Strongest single ≤RPE 8 |
| **Recent PR** | Best comparable performance in 90 days |
| **All-time PR** | Lifetime logged best |

A serious powerlifter can progress for months without hitting a true 1RM.

RackRite should celebrate those forms of progress.

### Add Progress Rate

Your current six-week percent change is good.

Add a slower trend:

> **Rate of gain: +1.3% / month**

Mathematically, a robust option is to fit performance against time using a Theil-Sen estimator rather than ordinary least squares because it is less sensitive to an anomalously good/bad workout.

Conceptually:

\[
\log(P_i)=a+b\cdot days_i
\]

then:

\[
MonthlyProgress =
100(e^{30b}-1)
\]

Do not show this until enough observations and enough time span exist.

For example:

> **+1.4% / month**  
> based on 11 qualified exposures over 10 weeks.

This gives advanced lifters something far more informative than “your squat is progressing.”

### Add Strength Volatility

Two athletes can have identical six-week trends:

**Athlete A:**  
180, 181, 180, 182, 182, 183

**Athlete B:**  
172, 187, 175, 189, 174, 184

Their predictability is completely different.

Use a robust dispersion measure:

\[
MAD=Median(|x_i-Median(x)|)
\]

and normalized variation:

\[
Noise\% =
100\times\frac{1.4826\times MAD}{MedianPerformance}
\]

Then classify internally:

**low / normal / high recent variability**.

This does two valuable things.

First, it gives the lifter context:

> **Strength trend: +1.2%**  
> Recent performance is highly variable, so evidence is moderate.

Second, it eventually lets you replace one-size-fits-all +2/-3 thresholds with athlete-specific meaningful-change bands.

### Evolve from fixed thresholds toward an athlete-specific noise band

Your current:

- +2% = progressing
- -3% = regressing
- ±1% ≈ neutral

is a good V1 heuristic.

The long-term premium system should calculate:

\[
MinimumMeaningfulChange =
\max(ProductFloor,\ k\times RecentNoise)
\]

where `ProductFloor` and `k` remain testable product parameters.

For a very consistent bencher, a +1.5% shift may be convincing.

For a lifter whose deadlift e1RM fluctuates ±4%, +1.5% is probably noise.

This remains completely deterministic.

It is also **personalized without AI**.

That distinction is important:

> **Deterministic does not have to mean generic.**

### Replace raw volume emphasis with workload context

Keep tonnage internally.

But I would expose three more interpretable workload metrics:

**Competition-lift exposures**

\[
ExposureRate =
\frac{qualified\ lift\ days}{weeks}
\]

**Hard sets**

\[
HardSet = RPE\ge8
\]

**Very hard sets**

\[
HighEffortSet = RPE\ge9
\]

Your existing config already uses RPE 9 for high-effort analysis.

You could additionally derive **heavy sets** using load relative to recent estimated capacity:

\[
RelativeIntensity =
\frac{weight}{CurrentCapacity}
\]

and count, for example, sets exceeding a product-defined intensity threshold.

The important part is not whether the exact threshold is 78%, 80% or 82%.

It is that UI language must be:

> **Recorded heavy work**  
> **Recorded hard work**  
> **Competition-lift exposure**

rather than pretending tonnage alone equals stimulus.

### Improve your fatigue/stimulus diagnostics by comparing the athlete to themselves

This is one of your best possible differentiators.

Do not say:

> “Four sets per week is too little.”

Instead ask:

> **What did this lifter's training look like during their own previous period of successful progress?**

Suppose Bench was progressing during a previous 6-week period with:

- 2.7 exposures/week,
- 9 hard competition-bench sets/week,
- median RPE 7.8.

Now it has stalled with:

- 1.3 exposures/week,
- 4 hard sets/week,
- median RPE 7.7.

That supports:

> **Lower-stimulus pattern**  
> Your recent recorded bench work is substantially below your own last productive period.

Now reverse it:

- previously 8 hard sets/week,
- now 14,
- median RPE +0.8,
- performance -2.5%.

Then:

> **Higher-stress pattern**  
> Performance is falling while effort and recorded competition-lift work are substantially above your previous productive period.

This is much more defensible than universal training-volume rules.

It is also deeply personalized.

And deterministic.

### Build status from multiple agreeing strength signals, not tonnage

I would eventually make status use a signal hierarchy like:

| Signal | Role |
|---|---|
| Comparable same-rep/similar-effort performance | Primary |
| RPE-adjusted e1RM | Strong secondary |
| Raw e1RM | Secondary |
| Recent robust slope | Confirmation |
| RPE trend | Explanation/context |
| Workload | Explanation/context |
| Frequency/exposure | Explanation/context |

Volume **must never vote directly for “you got stronger.”**

Doing more work is not proof of strength improvement.

### Preserve the current six-state system

Your current states are actually good:

**Learning → Progressing → Stable → Stalling → Plateaued → Regressing**

I would keep them.

But make the distinction extremely precise:

**Learning**  
Not enough reliable evidence.

**Progressing**  
Meaningful positive change with repeated support.

**Stable**  
No meaningful change, but not long enough/strong enough to call a plateau.

**Stalling**  
Previously positive trajectory has flattened or mildly deteriorated.

**Plateaued**  
Sufficient exposures over sufficient time with no meaningful improvement.

**Regressing**  
Meaningful negative change with repeated support.

A crucial design decision:

> **Stable is not bad.**

During some phases, stable performance under greater workload may even be useful.

Do not make every neutral period look like failure.

---

## The Progress screen I would actually ship

The best version is not a screen with twenty cards.

It is a **progressive-disclosure system**: five seconds for the normal user, deep detail for the obsessive powerlifter.

### The top of the screen should answer all three lifts immediately

Instead of opening with only the segmented control:

```text
PROGRESS

Your competition lifts

SQUAT              BENCH              DEADLIFT
↑ +3.2%            → +0.6%            ↓ -2.4%
PROGRESSING        STABLE             STALLING
Strong             Strong             Moderate
```

Tap Bench:

```text
Squat ↑ 3.2%    BENCH → 0.6%    Deadlift ↓ 2.4%
```

This fulfills the most fundamental requirement you identified:

> **A clear progression state for all three lifts.**

### The first selected-lift card should be Strength Now

```text
BENCH PRESS

Estimated strength
182.5 kg
+4.2 kg over 6 weeks

Comparable strength
+3.1%

Status
PROGRESSING

Evidence
STRONG
```

The absolute estimate and the trend are different concepts.

Keep both.

### The next card should be the premium hero: Next Benchmark

```text
NEXT BENCHMARK

122.5 kg × 3
RPE 7–8

↑ +2.5 kg

Your last 3 comparable exposures
supported an increase without a rise
in typical effort.

[Use in next workout]
```

This is where Progress eventually connects to Active Workout.

That button is incredibly important.

Not because it looks nice.

Because it closes the product loop:

> **history → analysis → decision → workout → new history**

That is what can make RackRite feel fundamentally smarter than a logging app.

### “Why?” should explain exactly three or four observable drivers

```text
WHY YOU'RE PROGRESSING

Comparable strength          ↑ +3.1%
4 of 5 recent exposures beat baseline

Effort                       → -0.1 RPE
Performance improved without higher effort

Hard competition work        → Stable
8.3 → 8.7 sets / week

Consistency                  ✓ Strong
No meaningful training gaps
```

Notice what disappeared:

**Estimated 1RM** does not need to be repeated here if it was already shown above.

The Why card should explain the result, not duplicate it.

### The trend graph should default to Strength

```text
STRENGTH TREND                        12W ▼

185 ┤                              ●
183 ┤                     ●  ● ──────
181 ┤            ●──●─────
179 ┤    ●──●────
177 ┤ ●
    └────────────────────────────────
      Jul        Aug       Sep     Oct

      +3.1% over 6 weeks
      +1.4% / month
```

Then allow:

**Strength | Effort | Workload**

rather than:

**Performance | E1RM | Volume**

“Performance” is an implementation word.

“Strength” is what the customer cares about.

### Below the graph, show PRs and meaningful milestones

```text
RECENT WINS

🏆 3-rep strength PR
125 × 3 @8
Sep 24

↓ Same weight, lower effort
120 × 3: RPE 8.5 → 7.5
Sep 12

↑ Estimated max
176 → 182.5 kg
Last 8 weeks
```

This would make the screen emotionally satisfying, not merely analytical.

The app should tell the lifter:

**“You are getting better, and here is proof.”**

### The information hierarchy should look like this

| Priority | Component | User question |
|---|---|---|
| Highest | Three-lift overview | Which lifts are progressing? |
| Highest | Strength/status | Am I stronger? |
| Highest | Next benchmark | What should I do? |
| High | Why | Why is RackRite saying this? |
| High | Strength trend | What is the longer-term direction? |
| Medium | Recent wins / PRs | What have I achieved? |
| Medium | Effort/workload detail | What changed in my training? |
| Advanced | Methodology | How was this calculated? |

That is much cleaner than trying to make all metrics equally important.

---

## Competitive position and the €5/month opportunity

The current market reinforces why **charts alone cannot be RackRite Pro's value proposition**.

Strong publicly offers PR/1RM information and volume/1RM progression graphs. citeturn11search0turn11search4 Hevy exposes heaviest weight, rep-target records, projected or true 1RM, set/session volume and workout-to-workout history; much of its progress data is available free, with Pro extending graph history. citeturn9view6turn9view12 StrengthLog provides statistics, graphs, goals and records across rep counts, while explicitly incorporating RPE/RIR into e1RM interpretation. citeturn11search1turn9view8

Boostcamp is especially relevant because its free offering already includes RPE/RIR logging, records and e1RM, while Pro adds Strength Score and advanced analytics. Its official site currently advertises Pro from $4.99/month. citeturn9view7 Strong's App Store listing describes a $4.99/month base subscription price, although actual localized in-app pricing varies. citeturn9view11

So a roughly **€5/month RackRite Pro cannot win simply by locking “more graphs” behind Pro**.

That market is already crowded.

### The competitive whitespace is interpretation

Based on the reviewed public feature materials:

| Product | Public progress emphasis | Lesson for RackRite |
|---|---|---|
| **Hevy** | PRs, e1RM, volume, history, exercise stats | Match its clarity and records; go far beyond raw visualization. citeturn9view6turn9view12 |
| **Strong** | 1RM/volume graphs, PRs, advanced statistics | Basic analytics are table stakes. citeturn11search0turn11search36 |
| **StrengthLog** | Stats, records, RPE/RIR-aware e1RM | RackRite must understand effort at least this well. citeturn11search1turn9view8 |
| **Boostcamp** | e1RM, RPE/RIR, auto-progression, advanced analytics, Strength Score | Users already expect progress to connect to future training. citeturn9view7turn11search2 |
| **RTS Training Lab** | e1RM trends, gain/loss rates, stress index, coaching dashboard | Serious lifters value rates and stress context, not just PRs. citeturn9view9 |
| **Evolve** | Stress, session RPE, volume, intensity, sleep plus adaptive programming | Shows how far “analytics” products are moving toward interpretation. citeturn9view10 |

The whitespace I would target is:

> **Transparent deterministic powerlifting analytics that turn workout history into a clear status, evidence level, explanation and next benchmark.**

You do not need to defeat these apps on exercise libraries, social networking, bodybuilding volume heatmaps, coaching content or AI programming.

You can beat them at one narrowly defined problem:

> **“What is happening to my squat, bench and deadlift, and what does my own training history justify doing next?”**

That is a much stronger identity.

### Do not create an opaque 0–100 “RackRite Score”

Boostcamp already offers a 0–100 Strength Score. citeturn9view7

I would not copy that as RackRite's centerpiece.

Your competitive advantage should be the opposite:

**Explainability.**

A lifter should always be able to tap:

> **Why Progressing?**

and see:

> Comparable strength +3.0%  
> 4/5 recent exposures supportive  
> Typical effort -0.2 RPE  
> No major gaps  
> Strong evidence

Same inputs → same result.

No mysterious score.

No “our algorithm thinks…”

No AI.

That is a credible brand position for serious lifters.

---

## What I would build next, in exact priority order

The strongest path is to enhance what already exists rather than rewrite Progress.

| Priority | Change | Why it matters |
|---|---|---|
| **Critical** | Three-lift overview | User understands S/B/D immediately |
| **Critical** | Comparable Strength engine | Solves the fundamental measurement problem |
| **Critical** | RPE/same-effort progress detection | Recognizes progress generic PR systems miss |
| **Critical** | Next Benchmark hero card | Converts analytics into action |
| **Critical** | Explicit evidence/confidence | Prevents false certainty |
| **Critical** | Rewrite Why card around observable signals | Turns stats into interpretation |
| **High** | PR lattice | Gives frequent, meaningful proof of progress |
| **High** | Session-based strength graph | Better strength visualization |
| **High** | Hard-set / effort / exposure context | Better plateau diagnosis than tonnage |
| **High** | Productive-period comparison | Personalized deterministic diagnosis |
| **High** | Benchmark outcome loop | Learns whether previous recommendations were successful |
| **Later** | Adaptive noise threshold | Personalized definition of meaningful change |
| **Later** | Robust progress-rate metric | Gives advanced lifters gain/loss rate |
| **Later** | Variation-to-lift mapping | Fixes competition-only workload blind spot |
| **Later** | Bodyweight / relative strength | Enables relative strength/DOTS-style tracking |
| **Later** | Meet date / training phase | Makes peak/taper interpretation smarter |

The first version requires surprisingly little new user data.

Nearly everything above through **productive-period comparison** can be built from what RackRite already stores:

**weight, reps, RPE, set type, exercise/lift family, completion/time.**

That is excellent news.

### The future Active Workout connection should be a deterministic contract

Once Progress is correct, I would make each lift generate a persistent concept such as:

```text
NextBenchmark {
  lift: "bench",
  intent: "increase",
  weight: 122.5,
  reps: 3,
  rpeMin: 7,
  rpeMax: 8,
  confidence: "strong",
  basis: "comparable_performance",
  referenceWeight: 120,
  referenceReps: 3
}
```

Then Active Workout can display:

> **Progress target: 122.5 × 3 @7–8**

Afterward, the result is evaluated deterministically.

For example:

| Result | Next progression state |
|---|---|
| Target completed, RPE ≤8 | Successful benchmark; can support next increment |
| Completed, RPE 8.5–9 | Successful but not enough headroom; likely repeat |
| Completed at ≥9.5 | Do not increase yet |
| Missed prescribed reps | Repeat/reduce according to predefined rule |
| RPE missing | Use lower-confidence load/repetition logic |
| Performance unexpectedly excellent | Record PR, but do not necessarily leap multiple increments |

This creates the most important loop in the entire product:

\[
Log
\rightarrow Analyze
\rightarrow Recommend
\rightarrow Execute
\rightarrow Evaluate
\rightarrow Recommend
\]

That can become the core of RackRite Pro.

### What I explicitly would not build yet

I would not add a generic readiness score from workout history alone.

I would not call workload changes “fatigue” with certainty.

I would not put tonnage beside e1RM as if both were forms of progress.

I would not combine squat, bench and deadlift into one opaque progress score.

I would not use a different arbitrary formula merely to make RackRite look sophisticated.

I would not add ten more charts.

I would not introduce sleep/recovery questionnaires until the training-history engine itself is excellent.

I would not claim to know the optimal weekly volume for an individual from population-level rules.

And I would not abandon your current conservative behavior of withholding recommendations when evidence is insufficient.

That last behavior is a feature, not a limitation.

A serious progress app should sometimes say:

> **Not enough evidence yet. Complete two more comparable bench exposures.**

instead of fabricating certainty.

### The final product principle

The screen should be designed around this sentence:

> **Every metric must either change the user's understanding of their progress or change what they should do next.**

If a statistic does neither, remove it from the main Progress screen.

The resulting RackRite Pro experience could be extremely simple visually while being sophisticated underneath:

```text
PROGRESS

SQUAT ↑ 3.2%       BENCH → 0.6%       DEADLIFT ↓ 2.4%
Progressing        Stable             Stalling


BENCH

Strength trend                              STABLE
+0.6% / 6 weeks                       Strong evidence

Estimated max
182.5 kg


NEXT BENCHMARK

120 kg × 3 @ RPE 7–8
REPEAT

Your strength is stable, but your last
2 comparable exposures were harder.
Build another clean exposure before increasing.


WHY

Comparable strength                     → +0.6%
Effort                                   ↑ +0.5 RPE
Hard competition work                   ↑ +18%
Consistency                                  Strong


STRENGTH TREND
          ●             ●
    ●  ●──────●────●──────
──────────────────────────────
       6w +0.6%   12w +2.8%


RECENT WINS

✓ 120 × 3 became 0.5 RPE easier since August
🏆 177.5 × 2 rep PR
✓ 7 consecutive weeks of bench exposure
```

That is not simply a statistics page.

It answers:

**Am I stronger?**  
**Is the result trustworthy?**  
**What is changing?**  
**What should I do next?**  
**What evidence proves it?**

That is the level I would target for a €5/month RackRite Pro.

And importantly, you are not starting from zero. Your existing status, evidence, diagnosis and benchmark architecture is already unusually close to the correct foundation. The biggest upgrade now is to make **comparable strength, effort-aware progress, evidence quality and next-action prescription** the center of the product, while moving raw e1RM and tonnage into supporting roles.