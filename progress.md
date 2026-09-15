You are acting as a senior/staff-level TypeScript + React Native engineer, product engineer, and software architect working inside the existing RackRite repository.

I need you to DESIGN A VERY DETAILED IMPLEMENTATION PLAN FIRST for the new RackRite Progress / Lift Intelligence feature described below.

DO NOT jump straight into implementation.

You have access to the entire repository.

You also have access to the Progress screen design through the Stitch MCP - the exact screen is called - Progress - Lift Intelligence (Calibrated Sync).

The Stitch MCP Progress screen is the VISUAL SOURCE OF TRUTH for this feature.

For cards use the already created shared components and if you need a new component and its reusble create it for shared

Use the Stitch screen for:

- layout
- visual hierarchy
- card composition
- spacing
- typography
- colors
- borders
- chart presentation
- SBD segmented control
- overall visual design

Do NOT invent a completely different design.

However, implementation must use the EXISTING RackRite design system and reusable components wherever possible.

The Stitch screen describes what the resulting screen should visually resemble.
The repository determines how it should actually be implemented.

==================================================
VERY IMPORTANT REPOSITORY RULE
==================================================

Before planning implementation, inspect how RackRite already implements features.

Follow the patterns that ALREADY EXIST in the repository.

Do not introduce a new architecture just because this feature is substantial.

Inspect examples of existing features and determine how RackRite currently handles things such as:

- domain types
- repositories
- database queries
- actions
- controllers
- reducers
- hooks
- selectors
- view models
- screens
- reusable UI components
- loading/error state
- navigation focus behavior
- request/version guards
- dependency injection
- tests
- naming
- file organization
- module boundaries

The new Progress feature should feel like it was built by the same codebase and team.

If existing RackRite features follow a pattern such as:

repository
→ actions
→ controller
→ reducer
→ view model
→ screen/components

then follow that pattern.

If the repository uses a slightly different architecture, follow the actual repository instead.

DO NOT create a parallel architecture specifically for Progress unless there is a very strong reason.

Reuse existing abstractions where they fit.

Do NOT force existing abstractions where they do not fit.

Be consistent with the repository.

==================================================
YOUR FIRST RESPONSIBILITY
==================================================

Before writing implementation code:

1. Inspect the existing repository thoroughly.

2. Inspect the current Progress feature/screen if one already exists.

3. Inspect several other mature RackRite features to understand the established architectural patterns.

4. Inspect the current workout/exercise/domain/database models directly from the repository.

5. Inspect existing repositories and database querying patterns.

6. Inspect existing controller/reducer/action/view-model conventions.

7. Inspect current shared UI components and design tokens.

8. Inspect charting utilities/components if any already exist.

9. Inspect testing conventions.

10. Inspect the Stitch MCP Progress screen.

11. Compare the repository and Stitch design against this specification.

12. Identify:

- what already exists
- what can be reused
- what must change
- what must be created
- any conflicts
- any assumptions

13. Produce a detailed implementation plan.

14. DO NOT BEGIN IMPLEMENTATION until the planning phase is complete.

If something in this specification conflicts with an established repository convention, identify it and recommend the best approach.

Do not blindly follow this specification if doing so would damage the architecture.

But preserve the product requirements described below.

==================================================
PRODUCT CONTEXT
==================================================

RackRite is a strength / powerlifting workout tracking application.

The Progress screen is NOT intended to become another generic workout analytics dashboard.

Its primary purpose is to become the foundation of RackRite's main differentiating paid feature:

LIFT INTELLIGENCE

RackRite should eventually be able to answer:

1. Is my squat/bench/deadlift actually progressing?
2. Is it stable?
3. Is progress beginning to stall?
4. Am I genuinely plateaued?
5. Am I regressing?
6. Why does RackRite believe that?
7. What should I do next?
8. After I change something, did the intervention actually work?

The Progress screen should therefore answer:

WHAT IS HAPPENING?
↓
WHAT SHOULD I DO?
↓
WHY DOES RACKRITE THINK THIS?
↓
SHOW ME THE DATA

This hierarchy is extremely important.

The screen should NOT be filled with unrelated statistics simply because they are available.

The intelligence is the product.

The charts are supporting evidence.

==================================================
SCOPE OF THE PROGRESS SCREEN
==================================================

Progress is ONLY concerned with the three COMPETITION LIFTS:

- squat
- bench
- deadlift

It should NOT currently perform Lift Intelligence for:

- lift variations
- accessories

Variations and accessories remain valid concepts elsewhere in RackRite.

For Progress, selecting a LiftFamily determines the entire screen.

The top selector is:

SQUAT | BENCH | DEADLIFT

There is NO variation selector.

Only actual competition-lift exercise data should directly drive competition-lift performance analysis in V1.

If the repository models competition lifts differently than expected, inspect the current domain model and use the repository's canonical way to identify:

- competition squat
- competition bench
- competition deadlift

Do NOT count a paused bench, close-grip bench, tempo squat, deficit deadlift, or other variation as direct competition-lift performance in V1.

They may become useful supporting information in future versions, but that is outside the current scope.

==================================================
SOURCE-OF-TRUTH / DERIVED DATA PRINCIPLE
==================================================

The existing workout database should remain the source of truth.

Progress/Lift Intelligence should derive its current analytics from historical workout data.

Conceptually:

RAW WORKOUT DATA
↓
SESSION METRICS
↓
TREND METRICS
↓
LIFT STATUS
↓
DIAGNOSIS
↓
RECOMMENDATION
↓
PROGRESS UI

Do NOT add persisted analytics fields simply because the Progress UI needs them.

Examples of things that should normally remain derived:

- estimated 1RM
- performance score
- current lift status
- plateau state
- weekly volume
- current performance trend
- current diagnosis
- current recommendation
- fatigue score
- evidence level

If the current repository already persists any analytics, inspect why and determine whether that existing pattern should be reused.

Do not duplicate derived data without a reason.

Persist additional information only when it represents a real historical event that cannot safely be reconstructed later.

Example future case:

A user explicitly accepts/starts a RackRite intervention.

That intervention happened at a specific point in time and may eventually need persistence.

The currently calculated recommendation generally does not.

==================================================
DATABASE / REPOSITORY REVIEW
==================================================

Inspect the existing Drizzle/SQLite schema and repositories.

Determine what query is necessary to efficiently retrieve historical competition-lift data.

Review existing indexes.

Progress will frequently need historical sets/exposures belonging to a selected competition lift.

Determine whether the existing indexes adequately support the required query.

If additional indexing is justified:

Explain:

- the exact expected query
- which columns are filtered/joined/sorted
- why SQLite would benefit
- whether the dataset size justifies it now
- what index should be added

Do NOT add indexes blindly.

Also inspect index naming for correctness.

If an existing index name does not accurately describe its indexed column, identify it.

Do not perform unrelated migrations merely for cosmetic cleanup unless the benefit justifies the migration.

==================================================
ANALYZABLE SET RULES
==================================================

RackRite currently has semantic set types.

Inspect the canonical SetType definition in the repository.

For Progress Intelligence, apply these principles:

WARMUP

- does NOT contribute to primary strength-performance analysis
- does NOT contribute to primary training volume
- cannot represent the session's performance set
- should normally be excluded from Lift Intelligence metrics

WORKING

- contributes to performance analysis
- contributes to meaningful training volume
- contributes to workload/stress analysis

TOP

- contributes to performance
- contributes to volume
- is often a strong performance candidate
- but MUST NOT automatically be the only performance set

BACKOFF

- contributes to performance where appropriate
- contributes to volume
- contributes to workload/stress analysis

CRITICAL:

Do NOT assume:

top set === session performance

A workout may contain only working sets.

Example:

100 x 5 @8
100 x 5 @8
100 x 5 @8

RackRite must still analyze the session correctly.

Likewise, do NOT invent arbitrary weights such as:

top = 1.0
working = 0.8
backoff = 0.5

unless there is a justified analytical reason.

Initially, set type provides semantics rather than arbitrary scoring coefficients.

==================================================
VALID HISTORICAL DATA
==================================================

Only stable historical training should affect the Progress analysis.

A currently active workout should normally NOT change the long-term Progress status while the lifter is still training.

Use the repository's canonical workout completion state.

Only completed historical workouts should normally contribute.

Individual sets used for analysis must also represent completed/valid performance.

At minimum, analysis needs defensively validated values such as:

- completed set
- weight exists
- reps exists
- valid positive weight
- valid positive repetitions

Inspect current domain invariants before adding duplicate validation.

Invalid/incomplete historical records should never crash Progress.

They should be safely excluded where appropriate.

==================================================
RPE IS OPTIONAL
==================================================

RackRite's intelligence must work without RPE.

Do NOT make RPE mandatory merely because it improves analysis.

WITHOUT RPE:

- estimated 1RM can still work
- load/repetition progression works
- volume analysis works
- basic trend analysis works
- basic plateau/regression detection can work

WITH RPE:

- same-workload comparisons become stronger
- effort-adjusted performance becomes possible
- fatigue/stress signals improve
- diagnostic evidence becomes stronger

PARTIAL RPE:

If only part of the historical data has RPE, do not pretend the RPE trend is complete.

The analysis should know how much RPE coverage exists.

Potential concept:

rpeCoverage =
valid analyzable sets containing RPE
/
valid analyzable sets

Do not necessarily expose this exact percentage to the user.

It exists so the analysis can understand the quality of its evidence.

==================================================
CORE ARCHITECTURAL PRINCIPLE
==================================================

The Progress screen must NOT contain the analytical logic.

Do not calculate complicated lift intelligence directly inside JSX.

Do not scatter analytics across React components.

Do not create independent React state for values that are derived from the same analysis result.

The feature should have a dedicated domain/application analysis layer consistent with existing repository patterns.

Conceptually:

database/repository
↓
historical competition-lift records
↓
pure metrics
↓
lift analysis
↓
diagnosis
↓
recommendation
↓
controller/view model
↓
Progress UI

The exact architecture and directory structure MUST follow RackRite's existing feature conventions.

Before proposing files, inspect how other RackRite features are structured.

Prefer copying an established architectural pattern over inventing a new one.

==================================================
RAW HISTORY REQUIREMENTS
==================================================

For the selected competition lift, the analysis layer needs enough information to reconstruct individual competition-lift training exposures.

Determine the minimal data shape after inspecting the repository.

Conceptually it needs information equivalent to:

- workout identity
- workout completion timestamp
- competition lift
- set identity
- set order
- set type
- weight
- repetitions
- RPE
- completion state/timestamp

Prefer one well-designed repository operation over repeatedly loading huge unrelated object graphs if the existing architecture supports focused repository queries.

But do NOT prematurely optimize.

Follow the repository style first.

==================================================
SESSION METRICS
==================================================

The first major analytical layer answers:

"How did this competition lift perform in this specific workout?"

Design an explicit domain representation for one completed competition-lift session.

It may contain concepts such as:

- workout/session identifier
- performed timestamp
- best estimated 1RM
- normalized performance value
- best representative set
- analyzable set count
- total meaningful volume
- average/median RPE if meaningful
- high-effort-set information
- RPE coverage

Do not blindly implement this exact shape.

Design it according to the repository architecture.

The important point is:

ONE WORKOUT EXPOSURE
↓
ONE STABLE SESSION-METRICS OBJECT

The later trend engine should consume these session-level metrics rather than reinterpreting raw sets everywhere.

==================================================
PERFORMANCE MEASUREMENT
==================================================

This is one of the most important technical decisions in the entire feature.

RackRite needs a reliable way to compare competition-lift performance across sessions even when:

- weight differs
- repetitions differ
- RPE differs
- RPE is absent

Examples:

100 x 5 @8
vs
102.5 x 5 @8

clearly improved.

100 x 5 @8
vs
100 x 5 @7

likely improved.

100 x 5 @7
vs
100 x 5 @9

likely worsened.

100 x 5 @8
vs
105 x 3 @8

requires normalization.

100 x 5
vs
102.5 x 5

still needs to be comparable without RPE.

The implementation plan MUST explicitly address:

1. How estimated 1RM will be calculated.

2. Whether an RPE-adjusted performance/e1RM metric should exist.

3. How sessions with RPE and sessions without RPE are compared.

4. How the representative/best performance set for a session is selected.

5. Whether one best set is sufficient or whether a robust multi-set measure is better.

6. How unusually high repetitions should be handled.

7. How low-rep near-maximal sets should be handled.

8. How a single unusually strong or poor set/session is prevented from dominating long-term status.

9. How the formula is isolated so it can evolve later.

10. How to avoid false precision.

Do NOT bury formulas inside UI code.

These calculations should be pure, named, documented, independently testable functions.

==================================================
ESTIMATED 1RM
==================================================

RackRite should derive estimated one-repetition-max performance from appropriate valid sets.

Evaluate a reasonable V1 formula.

For example, if a formula similar to Epley is selected:

e1RM = weight * (1 + reps / 30)

it must live behind a named function.

Do not scatter the formula across the codebase.

If RPE/RIR adjustment is used, isolate that calculation too.

One conceptual approach could involve:

RIR = 10 - RPE

effective max-repetition estimate =
performed reps + estimated RIR

But this is NOT a mandatory formula.

Evaluate alternatives critically.

Do NOT present estimated 1RM as a true tested maximum.

==================================================
SESSION PERFORMANCE SIGNAL
==================================================

RackRite needs a normalized performance signal because all future states depend on it.

The system should recognize:

CASE A

100x5 @8
→
102.5x5 @8

positive

CASE B

100x5 @8
→
100x5 @7

positive

CASE C

100x5 @7
→
100x5 @9

negative

CASE D

100x5
→
102.5x5

positive even without RPE

CASE E

several good sessions
→ one unusually poor workout

should NOT instantly create REGRESSING.

CASE F

several flat sessions
→ one unusually strong session

should NOT automatically create PROGRESSING if the overall evidence is still weak.

The plan must define how RackRite creates a stable session-level performance metric and how that feeds into multi-session trends.

==================================================
VOLUME
==================================================

Initial meaningful training volume can be approximately derived using:

Σ(weight × reps)

for valid non-warmup training sets.

Volume is supporting evidence.

Volume is NOT equivalent to training quality.

Do not conclude:

more volume = better

or:

less volume = worse.

Volume becomes valuable in context:

- volume ↑ + performance ↑
  may be productive

- volume ↑ + performance ↓ + RPE ↑
  may support a fatigue hypothesis

- volume ↓ + performance stable/improving
  may indicate improved efficiency/recovery

The analytical model must keep these concepts separate.

==================================================
RPE METRICS
==================================================

Derive useful RPE information where enough RPE data exists.

Potential metrics:

- average RPE
- median RPE
- representative/top-set RPE
- high-effort-set count
- percentage of high-RPE sets
- RPE trend

Avoid meaningless aggregation.

Example:

If a workout has 10 analyzable sets but only 1 has RPE, displaying:

AVERAGE RPE 8.5

as if it describes the entire session would be misleading.

Track data availability/coverage.

The diagnosis layer should understand whether RPE evidence is:

- unavailable
- partial
- reasonably strong

==================================================
FREQUENCY
==================================================

Competition-lift training frequency should be derived from completed competition-lift exposures.

Do not persist a redundant weekly-frequency field unless there is a demonstrated architectural reason.

Examples:

bench:
3 completed competition-bench exposures/week

squat:
2 exposures/week

The exact weekly grouping must respect the app's existing date/time/calendar utilities.

Inspect those utilities before building new date logic.

==================================================
ROLLING / TREND METRICS
==================================================

After session metrics, RackRite needs to understand performance over time.

The analytical engine should support meaningful recent windows.

Potential windows:

- recent N sessions
- 4 weeks
- 6 weeks
- 8 weeks

Do not add every possible range merely because it is possible.

Choose a clear V1 default and justify it.

Potential derived values:

- normalized performance trend
- e1RM trend
- volume trend
- RPE trend
- frequency trend
- positive session count
- negative session count
- flat session count
- analyzed session count
- elapsed training time
- RPE data quality

Avoid simply calculating:

(lastValue - firstValue) / firstValue

and calling that the entire trend if a more robust but still simple method would better handle noise.

Evaluate V1 approaches such as:

- linear trend/slope
- rolling mean
- robust median comparison
- weighted recent history
- simple moving average

Choose something:

- explainable
- deterministic
- conservative
- easily testable
- easy to tune

Do NOT turn V1 into an academic statistical project.

==================================================
PRIMARY LIFT STATES
==================================================

Every selected competition lift must eventually resolve to ONE primary state:

- learning
- progressing
- stable
- stalling
- plateaued
- regressing

These are mutually exclusive UI states.

==================================================

1. LEARNING
   \==================================================

Meaning:

RackRite does not yet have enough trustworthy information to classify the selected lift.

Examples:

- brand-new user
- no completed competition-lift sessions
- only one or two useful sessions
- only warmups
- invalid historical sets
- insufficient elapsed training period
- insufficient usable performance information

UI concept:

LEARNING

"RackRite is still learning your bench performance."

Show useful available information where appropriate.

Example:

"3 analyzed bench sessions."

Recommendation:

"Continue training normally. RackRite needs more history before making a reliable assessment."

Never fabricate a classification simply to avoid an empty state.

================================================== 2. PROGRESSING
==================================================

Meaning:

There is meaningful positive performance movement supported by enough evidence.

Potential evidence:

- normalized performance increasing
- e1RM increasing
- heavier work at comparable RPE
- same workload at lower RPE
- several recent positive exposures
- positive trend not entirely explained by one outlier

UI:

PROGRESSING

"Your bench performance is improving consistently."

Typical recommendation:

KEEP YOUR CURRENT APPROACH

Do NOT recommend change merely to appear intelligent.

If the training is working, telling the user to continue is valuable.

================================================== 3. STABLE
==================================================

Meaning:

Performance is not meaningfully moving upward or downward.

IMPORTANT:

Stable is NOT necessarily negative.

Strength may intentionally be maintained during certain periods.

UI:

STABLE

"Your recent bench performance is holding steady."

Typical recommendation:

"Maintain your current approach and continue monitoring."

Do NOT classify every period without PRs as a plateau.

================================================== 4. STALLING
==================================================

Meaning:

Progress appears to be slowing and deserves monitoring, but evidence is not yet strong enough to call a genuine plateau.

This is an EARLY WARNING state.

UI:

STALLING

"Bench progress has slowed across recent sessions."

Typical recommendation:

MONITOR BEFORE MAKING A MAJOR CHANGE

Potential:

"RackRite will reassess after your next 2 competition-bench sessions."

Do not aggressively change programming based on weak evidence.

================================================== 5. PLATEAUED
==================================================

Meaning:

There has been sufficient training exposure and sufficient time, but meaningful performance progression has stopped.

A plateau is NOT:

- no PR this week
- one bad workout
- repeating the same load once
- two flat sessions

Plateau classification must require persistence.

UI:

PLATEAUED

"Your bench has shown no meaningful progression across the recent training period."

This state should trigger deeper diagnosis.

================================================== 6. REGRESSING
==================================================

Meaning:

Performance is meaningfully and persistently moving backwards.

Potential evidence:

- normalized performance declining
- e1RM falling
- same workload requiring meaningfully higher RPE
- multiple exposures below previous baseline

One bad day is NOT regression.

UI:

REGRESSING

"Recent bench performance is consistently below your previous baseline."

This should receive more attention than stable/stalling.

==================================================
STATUS THRESHOLDS
==================================================

All important analytical thresholds must be centralized.

Do not scatter magic values across functions.

Potential thresholds include:

- minimum analyzable sessions
- minimum elapsed duration
- meaningful positive trend
- stable/neutral range
- stalling threshold
- plateau minimum exposure count
- plateau minimum duration
- regression threshold
- outlier handling
- required RPE coverage
- analysis window lengths

These thresholds are product/analytical configuration.

They should be:

- explicit
- named
- documented
- testable
- easy to tune

Do not pretend arbitrary thresholds are established physiological laws.

The planning stage should propose conservative initial values and explain the reasoning.

==================================================
STATUS STABILITY / HYSTERESIS
==================================================

Status must not flicker unpredictably.

BAD:

Workout 1:
PROGRESSING

Workout 2:
REGRESSING

Workout 3:
PROGRESSING

Workout 4:
PLATEAUED

This destroys trust.

The algorithm must use sufficient evidence and reasonable persistence.

Consider:

- rolling windows
- minimum sample count
- threshold margins
- hysteresis
- recent-vs-baseline comparison
- outlier resistance

The plan must explicitly describe how V1 avoids unnecessary status oscillation.

==================================================
EVIDENCE LEVEL
==================================================

Do NOT display fake statistical precision such as:

Confidence: 83.72%

unless RackRite someday uses a genuinely calibrated probabilistic model.

For V1 use:

- weak
- moderate
- strong

Evidence level may consider:

- number of analyzed sessions
- elapsed history
- consistency of trend
- RPE availability
- data completeness
- agreement between multiple signals
- conflicting signals
- outliers

This is distinct from the primary lift state.

Example:

status:
PLATEAUED

status evidence:
STRONG

diagnosis:
FATIGUE

diagnosis evidence:
MODERATE

==================================================
DIAGNOSIS / WHY?
==================================================

Status answers:

WHAT IS HAPPENING?

Diagnosis answers:

WHY MIGHT THIS BE HAPPENING?

These must be separate concepts.

Initial V1 diagnosis should remain intentionally limited.

Potential initial diagnoses:

- none
- fatigue
- insufficient_stimulus
- excessive_intensity
- inconsistent_training
- insufficient_evidence

Do NOT build 20 weak diagnostic categories.

==================================================
FATIGUE
==================================================

Potential supporting signals:

- performance worsening or flattening
- RPE increasing
- meaningful volume increase
- high-effort work increasing
- frequency increase
- repeated weaker sessions

RackRite should use language such as:

"Your recent pattern is consistent with accumulated fatigue."

NOT:

"You are definitely fatigued."

Workout logs cannot directly measure physiological fatigue.

==================================================
INSUFFICIENT STIMULUS
==================================================

Potential supporting evidence:

- performance flat
- workload meaningfully lower than previous productive periods
- frequency decreased
- no progression in training demand
- little fatigue evidence

When enough history exists, prefer comparing the athlete to THEMSELVES.

Do not claim a generic universal set range is optimal.

==================================================
EXCESSIVE INTENSITY
==================================================

Potential supporting signals:

- frequent very-high-RPE competition-lift work
- repeated near-maximal efforts
- high intensity with deteriorating performance
- insufficient lower-stress work

Be conservative.

==================================================
INCONSISTENT TRAINING
==================================================

Potential supporting signals:

- long gaps between competition-lift exposures
- highly irregular frequency
- insufficient continuous training to establish a useful trend

Do not misclassify inconsistent exposure as a physiological plateau.

==================================================
INSUFFICIENT EVIDENCE
==================================================

Use this state frequently when necessary.

It is much better for RackRite to say:

"RackRite does not yet have enough evidence to identify the likely cause."

than to confidently give a poor recommendation.

==================================================
PERSONAL BASELINES
==================================================

Long term, one major competitive advantage should be:

COMPARE THE ATHLETE AGAINST THEMSELVES.

For newer users:

use conservative/general performance analysis.

For established users:

begin comparing current training with the user's historical response.

Potential future insights:

"Your bench historically performs better around your current training frequency."

"Previous periods with this amount of bench volume were followed by declining performance."

"Your strongest bench progression occurred under lower average RPE."

This level of personalization does NOT necessarily need to be fully implemented now.

But V1 architecture must not make it difficult later.

Do not hardcode population averages as universal truths.

==================================================
RECOMMENDATION ENGINE
==================================================

After Status + Diagnosis, RackRite must answer:

WHAT SHOULD I DO?

Recommendations should be deterministic in V1.

The underlying decision should NOT require an LLM.

Possible recommendation categories may include:

- maintain
- monitor
- reduce_volume
- increase_volume
- reduce_intensity
- reassess
- insufficient_evidence

The exact domain union should be designed after repository inspection.

Potential mapping:

PROGRESSING
→ maintain

STABLE
→ maintain / monitor

STALLING + weak evidence
→ monitor

PLATEAUED + fatigue evidence
→ reduce training stress

REGRESSING + rising effort/workload
→ reduce stress / reassess

PLATEAUED + unclear cause
→ conservative recommendation / gather additional evidence

Do NOT force every status to produce an intervention.

"Keep doing what you're doing."

and

"Wait before changing anything."

are valid recommendations.

==================================================
RECOMMENDED NEXT SET / BENCHMARK
==================================================

The architecture should support an optional recommended performance target.

Potential representation:

weight
reps
target RPE

Example while progressing:

NEXT TARGET

102.5 KG × 3

TARGET RPE 8

Example during a fatigue-related intervention:

NEXT BENCHMARK

100 KG × 3

TARGET RPE 7–8

This should be connected to the performance analysis and recommendation.

Do NOT simply implement:

lastWeight + 2.5kg

and call it intelligent.

If a reliable recommended-set algorithm is too large for V1:

- design the domain so it can be added cleanly later
- allow recommendation to have no suggested set
- do NOT fabricate targets
- explicitly defer it in the implementation plan

The plan should decide whether a defensible first version belongs in this implementation.

==================================================
FUTURE INTERVENTION SYSTEM
==================================================

Eventually RackRite should close the full feedback loop:

DETECT
↓
RECOMMEND
↓
USER APPLIES CHANGE
↓
COLLECT NEW DATA
↓
REASSESS
↓
DID IT WORK?
↓
LEARN

Example:

RackRite:

"Reduce bench volume approximately 20% for one week."

Then:

0 / 2 reassessment sessions

Then:

1 / 2

Then:

REASSESSMENT COMPLETE

Performance +2.4%
Average RPE -0.6

"Performance recovered."

This is NOT necessarily V1.

However, keep this future requirement in mind when designing recommendation types.

Current recommendation:
derived

Accepted/started historical intervention:
may eventually require persistence

Do NOT add an intervention database system now unless this implementation genuinely needs it.

==================================================
AI REQUIREMENT
==================================================

CORE LIFT INTELLIGENCE MUST NOT DEPEND ON AI.

Do NOT:

send raw history to an LLM and ask:

"Is this athlete plateaued?"

The underlying intelligence must come from:

- deterministic calculations
- deterministic trends
- explicit rules
- explainable evidence

Example engine result:

status:
plateaued

performanceTrend:
-1.8%

rpeTrend:
+0.8

volumeTrend:
+24%

diagnosis:
fatigue

evidence:
moderate

A future AI feature may explain this conversationally.

But if AI disappeared completely:

RackRite Progress must still work.

==================================================
STITCH MCP / UI IMPLEMENTATION
==================================================

The Progress screen design available through Stitch MCP is the visual reference for this implementation.

Inspect it before planning the UI.

Do not approximate it from memory.

Use it to understand:

- visual hierarchy
- dimensions
- spacing
- cards
- typography
- segmented control
- colors
- chart composition
- section ordering
- visual emphasis

However:

DO NOT blindly copy generated Stitch implementation code if doing so conflicts with RackRite's architecture or design system.

Translate the Stitch design into RackRite's existing components and conventions.

Examples:

If RackRite already has:

- AppText
- Button
- SurfaceCard
- shared segmented control
- spacing tokens
- theme colors
- chart primitives
- icon wrappers

reuse them.

Do NOT create duplicate generic components merely because Stitch generated its own versions.

The screen should visually match Stitch while architecturally matching RackRite.

==================================================
FINAL PROGRESS SCREEN INFORMATION ARCHITECTURE
==================================================

The user has already decided the primary information hierarchy.

The core screen must contain:

HEADER

SQUAT | BENCH | DEADLIFT

1. LIFT STATUS
2. NEXT ACTION
3. WHY THIS STATUS
4. PERFORMANCE TREND

Do NOT add unrelated sections.

Do NOT restore old sections simply because the current code previously had them.

Specifically, Progress does NOT currently need:

- lift variation selector
- Recent PRs
- dedicated Personal Record hero
- Recent Sessions
- separate giant Weekly Volume card
- bodyweight
- streaks
- generic readiness
- calories
- social information
- AI chat

History already answers:

"What did I do?"

Progress answers:

"Is what I am doing working?"

Keep that separation.

==================================================
CARD 1 — LIFT STATUS
==================================================

This is the most important card.

It answers:

HOW IS THIS LIFT DOING?

Example:

BENCH PRESS

PROGRESSING

"Your bench performance is improving consistently."

+3.4%
6-WEEK PERFORMANCE

112.5 KG
ESTIMATED 1RM

8
SESSIONS ANALYZED

Possible statuses:

LEARNING
PROGRESSING
STABLE
STALLING
PLATEAUED
REGRESSING

Status must be the visually dominant idea.

Estimated 1RM supports the status.

It is not the primary hero anymore.

The card must gracefully handle:

- no e1RM
- insufficient sessions
- missing RPE
- no calculable trend
- learning state

Do NOT display:

0%

when the actual answer is:

not enough data

==================================================
CARD 2 — NEXT ACTION
==================================================

It answers:

WHAT SHOULD I DO?

Example progressing:

NEXT ACTION

KEEP YOUR CURRENT APPROACH

"Your current bench training is producing progress.
No meaningful adjustment is recommended."

Optional:

NEXT TARGET

102.5 KG × 3

TARGET RPE 8

"RackRite will reassess after 2 bench sessions."

Example stalling:

NEXT ACTION

MONITOR BEFORE CHANGING YOUR PROGRAM

"Progress has slowed, but there isn't enough evidence for a major adjustment yet."

Example learning:

NEXT ACTION

KEEP LOGGING BENCH SESSIONS

"RackRite needs more training history before making a reliable recommendation."

The content should come from the recommendation/analysis layer.

Do not implement business logic inside the card.

Do not show a suggested set if the system cannot justify it.

==================================================
CARD 3 — WHY THIS STATUS
==================================================

It answers:

WHY DOES RACKRITE THINK THIS?

Example:

WHY THIS STATUS

PERFORMANCE +3.4% ↑
ESTIMATED 1RM +2.7% ↑
AVERAGE RPE -0.1 →
WEEKLY VOLUME +6% →

"4 of your last 5 comparable bench sessions improved."

Potential additional section:

LIKELY EXPLANATION

ACCUMULATED FATIGUE

MODERATE EVIDENCE

Only show meaningful evidence.

Missing data must be represented appropriately.

Do NOT present partial RPE history as a highly reliable RPE trend.

Determine whether the established RackRite UI convention favors:

- hiding unavailable evidence
  or
- showing "Not enough data"

and remain consistent.

==================================================
CARD 4 — PERFORMANCE TREND
==================================================

Use the Stitch MCP design as the visual reference.

Tabs:

PERFORMANCE | E1RM | VOLUME

Default tab:

PERFORMANCE

Example:

PERFORMANCE TREND

LAST 8 WEEKS

+3.4%
IMPROVING

[chart]

The chart consumes derived trend points.

It must gracefully handle:

- no points
- one point
- two points
- irregular dates
- multiple sessions on one day
- missing RPE
- equal values
- extreme values
- missing e1RM
- no meaningful volume

Do not render misleading visualizations merely to keep the chart populated.

==================================================
SBD SELECTOR
==================================================

The user selects:

Squat
Bench
Deadlift

Changing it refreshes the entire analysis below.

The selected lift is real UI state.

The metrics are derived state.

The Stitch screen may include subtle state indicators in the SBD control.

If they are present, evaluate whether they can be implemented cleanly with the current segmented-control component.

Do not make the selector visually noisy.

==================================================
REACT / CONTROLLER STATE
==================================================

Do NOT create separate React state for every analytical value.

Bad:

const [e1rm, setE1rm]
const [volumeTrend, setVolumeTrend]
const [status, setStatus]
const [diagnosis, setDiagnosis]
const [recommendation, setRecommendation]

These are all derived from one analysis result.

The true feature state should remain small.

Conceptually:

selectedLiftFamily

request/load status

analysis result

Possibly:

selectedTrendMetric

as local UI state.

Use the existing RackRite controller/reducer/state conventions.

If other features use:

- reducer
- stateRef
- requestVersionRef
- actions
- controllers
- focused state handling

follow those patterns where relevant.

Do not introduce Zustand/Redux/another new state library merely for Progress.

==================================================
CONCEPTUAL ANALYSIS OUTPUT
==================================================

The Progress UI ultimately needs a coherent analysis result containing concepts equivalent to:

lift family

status:

- value
- evidence
- summary

current:

- estimated 1RM
- recent performance change
- analyzed session count
- window

diagnosis:

- type
- evidence

recommendation

evidence:

- performance trend
- e1RM trend
- RPE trend
- volume trend
- frequency trend
- positive session count
- analyzed sessions

trends:

- performance data points
- e1RM points
- volume points

DO NOT blindly copy this structure.

Design the proper types based on existing RackRite conventions.

The key requirement is that:

ONE ANALYSIS RESULT

should be able to fully drive the four core cards.

==================================================
LOADING / ERROR / EMPTY STATES
==================================================

Explicitly design these states.

LOADING

- initial load
- selected lift changes

If switching asynchronously, avoid visually replacing the selected lift with stale analysis.

ERROR

- repository failure
- unexpected analytical failure

Do not silently convert errors into "stable" or "learning".

NO HISTORY

Selected competition lift has never been completed.

LEARNING

"No completed bench sessions yet."

NO ANALYZABLE SETS

Competition bench exists in historical workouts, but no meaningful completed sets can be analyzed.

INSUFFICIENT HISTORY

Some valid data exists, but classification is premature.

MISSING RPE

Analysis continues.

RPE-specific evidence is unavailable.

PARTIAL RPE

Use only where defensible.

==================================================
EDGE CASES
==================================================

The implementation plan and tests must explicitly address these.

1. Brand-new user with zero workouts.

2. User has workouts but has never performed the selected competition lift.

3. User has performed only lift variations.

Example:
paused bench but never competition bench.

Paused bench must NOT count as competition-bench performance in V1.

4. Competition-lift workout contains only warmups.

5. Set with null weight.

6. Set with null repetitions.

7. Unfinished sets.

8. Active workout contains completed competition-lift sets.

It should normally not affect stable historical Progress until the workout is completed.

9. Completed workout with unexpectedly invalid/null completion metadata.

Handle defensively.

10. RPE absent from every session.

11. RPE present only sporadically.

12. One extreme positive outlier.

13. One extreme negative outlier.

14. One poor session after weeks of progress.

15. One excellent session after weeks of flat performance.

16. Multiple competition-lift sessions on the same calendar day.

17. Highly irregular frequency.

18. Long break from the lift.

19. Returning after a multi-week/month break.

20. Only 1–3 analyzable sessions.

21. High-repetition sets where e1RM formulas become less reliable.

22. Singles/doubles near maximal effort.

23. Same weight and reps with lower RPE.

24. Same weight and reps with higher RPE.

25. Load increases while RPE also increases.

This may be ambiguous and must not automatically be considered strong progress.

26. Volume increases while performance increases.

Do not diagnose fatigue merely because volume rose.

27. Volume increases while performance decreases and RPE increases.

Potential fatigue evidence.

28. Volume decreases while performance remains stable or improves.

Potentially positive adaptation/efficiency.

29. Historical completed workout edited.

Derived analysis must update.

30. Historical workout deleted.

Derived analysis must update.

31. Exercise identity changes or invalid references.

Handle according to existing repository guarantees.

32. Duplicate/corrupt historical data.

Do not crash.

33. Workout timestamp around midnight.

34. Local timezone/week boundary.

Use existing local-calendar utilities where possible.

35. User rapidly switches:

Squat → Bench → Deadlift

If async loading exists, stale Bench response must not overwrite Deadlift.

Follow existing request-version/race-prevention patterns.

36. Repository results are not sorted.

Analysis must produce deterministic ordering.

37. Baseline value is zero or invalid.

Avoid division-by-zero.

38. All chart values equal.

39. Floating point artifacts.

Example:

102.499999999

must never appear.

40. Units.

Follow the current RackRite unit conventions.

Do not invent an unrelated units architecture while building Progress.

41. Multiple competition-lift exercises accidentally exist for the same family due to bad historical data.

Handle defensively based on current domain guarantees.

42. Set ordering is incorrect or duplicated.

Do not rely blindly on index uniqueness if the database does not guarantee it.

43. Workout contains multiple entries of the same competition lift.

Determine how this is currently allowed/represented and how one session should aggregate them.

==================================================
TRUST / PRODUCT LANGUAGE
==================================================

RackRite must communicate uncertainty correctly.

GOOD:

"Your recent performance appears to be slowing."

"Your training currently appears productive."

"This pattern is consistent with accumulated fatigue."

"RackRite does not have enough evidence yet."

BAD:

"You are definitely fatigued."

"Your program is bad."

"You need exactly 12 sets."

"Your optimal volume is 13.4 sets."

Do not create fake scientific certainty.

==================================================
SCREEN RESPONSIBILITY
==================================================

Progress:

"Is what I'm doing working?"

History:

"What did I do?"

Workout:

"What am I doing right now?"

Templates:

"What am I planning to do?"

Maintain these boundaries.

Do not duplicate History content on Progress.

==================================================
V1 PRIORITIES
==================================================

Prioritize correctness over breadth.

The first useful implementation should focus on:

1. Correct competition-lift history retrieval.

2. Correct filtering of analyzable training.

3. Reliable session-performance derivation.

4. Trend calculation.

5. Lift-state classification.

6. Evidence generation.

7. Conservative recommendation generation.

8. Mapping analysis into the four-card Progress UI.

9. Comprehensive analysis tests.

Do NOT prioritize:

- AI
- machine learning
- social features
- huge training-block systems
- dozens of diagnoses
- personalized population models
- coach dashboards
- advanced intervention persistence

==================================================
TESTING REQUIREMENTS
==================================================

The core Lift Intelligence logic should be testable without rendering React Native.

Prefer pure functions for:

- identifying analyzable sets
- e1RM calculation
- RPE-adjusted performance
- session performance
- session metrics
- weekly grouping
- trend calculation
- evidence calculation
- status classification
- diagnosis
- recommendation

Use the testing conventions already present in the repository.

Prefer table-driven tests where suitable.

At minimum include scenario coverage like:

==================================================
A. CLEAR PROGRESSION
==================================================

100x5 @8
102.5x5 @8
105x5 @8

Expected:
positive trend
eventually progressing

==================================================
B. SAME LOAD, LOWER RPE
==================================================

100x5 @9
100x5 @8
100x5 @7

Expected:
positive performance signal

==================================================
C. SAME LOAD, HIGHER RPE
==================================================

100x5 @7
100x5 @8
100x5 @9

Expected:
negative performance signal after enough evidence

==================================================
D. SINGLE BAD SESSION
==================================================

Several improving sessions
then one poor session

Expected:
do not immediately flip to regressing

==================================================
E. LITTLE HISTORY
==================================================

2 flat sessions

Expected:
learning, not plateaued

==================================================
F. PROLONGED FLAT PERFORMANCE
==================================================

Enough exposures/time with no meaningful improvement

Expected:
plateaued when configured evidence requirements are met

==================================================
G. FATIGUE-LIKE PATTERN
==================================================

performance ↓
volume ↑
RPE ↑

Expected:
fatigue becomes plausible diagnosis

Do not necessarily assert strong evidence if the dataset is small.

==================================================
H. NO RPE
==================================================

Expected:
basic performance analysis still works

RPE-specific evidence unavailable

==================================================
I. WARMUPS ONLY
==================================================

Expected:
no analyzable competition performance

==================================================
J. VARIATION ONLY
==================================================

Paused bench only

Expected:
competition bench remains learning/no history

==================================================
K. ACTIVE WORKOUT
==================================================

Expected:
not included in completed historical trend

==================================================
L. INCOMPLETE SETS
==================================================

Expected:
ignored safely

==================================================
M. SINGLE STRONG OUTLIER
==================================================

Expected:
does not dominate multi-week status

==================================================
N. LONG TRAINING GAP
==================================================

Expected:
algorithm should not blindly interpret pre-gap and post-gap values as a continuous uninterrupted training trend.

==================================================
O. RAPID LIFT SWITCHING
==================================================

Expected:
latest selected lift owns the final UI state.

==================================================
PERFORMANCE REQUIREMENTS
==================================================

This is local historical training data.

Do not overengineer optimization.

But avoid obvious issues:

- N+1 database queries
- repeatedly loading unrelated workout data
- recalculating unrelated lifts unnecessarily
- unstable expensive computations during render

Prefer:

- deterministic analysis
- clean repository query
- calculations outside render
- memoization only where useful

Do NOT persist derived analytics solely as a premature optimization.

If profiling later shows a problem, caching can be introduced.

==================================================
EXTENSIBILITY
==================================================

Design V1 so these future features can fit naturally:

- recommended next set
- personalized volume-response ranges
- personalized frequency response
- training-block comparison
- intervention tracking
- intervention outcome analysis
- historical recommendation success
- automatic training adjustments
- personal lift profile
- Ask RackRite AI
- coach-facing analysis

But do NOT implement them simply because they are listed.

==================================================
WHAT NOT TO DO
==================================================

Do NOT:

- redesign the Stitch screen arbitrarily
- ignore RackRite feature architecture
- create an entirely new architectural pattern
- duplicate existing shared UI primitives
- store current plateau status in workout rows
- store calculated e1RM without strong justification
- put analytics inside JSX
- require RPE
- count lift variations as competition-lift history
- use warmups in primary progression analysis
- define plateau as "no recent PR"
- react strongly to one poor workout
- display fake confidence percentages
- use AI as the decision engine
- claim population averages are personalized recommendations
- recommend changes just to appear useful
- implement dozens of speculative database entities
- recreate History inside Progress
- create premature complex ML/statistical systems
- add abstractions merely because this feature is important

==================================================
EXPECTED PLANNING OUTPUT
==================================================

DO NOT IMPLEMENT YET.

Produce a detailed plan containing the following sections.

==================================================

1. REPOSITORY FINDINGS
   \==================================================

Explain what you found after inspecting the repository:

- current Progress implementation
- current Progress route/screen
- relevant workout domain
- exercise modeling
- database structure
- repositories
- actions
- controllers
- reducers
- hooks
- selectors
- view models
- UI primitives
- chart utilities
- date/calendar utilities
- tests
- feature folder conventions

Explicitly identify 2–3 existing features that provide the closest architectural examples for how this feature should be built.

Explain which patterns from those features should be followed.

================================================== 2. STITCH SCREEN FINDINGS
==================================================

Inspect the Progress design through Stitch MCP.

Explain:

- current visual hierarchy
- exact sections
- reusable patterns
- which existing RackRite components match the Stitch elements
- where a new dedicated component is necessary

The implementation should preserve the Stitch layout closely.

================================================== 3. PROPOSED DOMAIN DESIGN
==================================================

Describe:

- core Lift Intelligence types
- session-level types
- trend types
- status
- evidence
- diagnosis
- recommendation
- UI-facing analysis result

Explain responsibilities.

Do NOT create redundant domain models where existing ones can be reused.

================================================== 4. DATA FLOW
==================================================

Show the complete flow.

Example:

SQLite
↓
existing/new repository operation
↓
historical competition-lift records
↓
session metric derivation
↓
trend calculation
↓
status classification
↓
diagnosis
↓
recommendation
↓
controller/state
↓
view model
↓
Progress screen/cards

Use the actual architecture names from the repository.

================================================== 5. PERFORMANCE FORMULA DESIGN
==================================================

This section is extremely important.

Explain your proposed V1 approach for:

- e1RM
- RPE adjustment
- missing RPE
- best/representative set selection
- session performance score
- high-repetition sets
- near-maximal sets
- outliers
- trend normalization

Explain why this design is appropriate.

Identify weaknesses.

Avoid false precision.

================================================== 6. STATUS ALGORITHM
==================================================

Propose concrete initial logic for:

- learning
- progressing
- stable
- stalling
- plateaued
- regressing

Include:

- minimum session count
- minimum elapsed history
- thresholds
- analysis window
- status stability strategy
- outlier behavior

Explain each threshold.

Keep all thresholds configurable.

================================================== 7. EVIDENCE MODEL
==================================================

Define how:

WEAK
MODERATE
STRONG

are calculated.

Explain which signals influence evidence strength.

================================================== 8. DIAGNOSIS LOGIC
==================================================

Describe V1 rules for:

- fatigue
- insufficient stimulus
- excessive intensity
- inconsistent training
- insufficient evidence

Explain which signals support and contradict each diagnosis.

================================================== 9. RECOMMENDATION LOGIC
==================================================

Map status + diagnosis + evidence into conservative recommendations.

Explicitly show examples such as:

progressing
→ maintain

stalling + weak evidence
→ monitor

plateaued + fatigue evidence
→ reduce stress

uncertain diagnosis
→ gather more evidence

Also decide whether recommended next-set generation should be implemented now or deferred.

================================================== 10. UI IMPLEMENTATION PLAN
==================================================

Map the Stitch screen into actual RackRite components.

Expected conceptual structure:

ProgressScreen

    ProgressHeader / existing header

    SBD selector

    LiftStatusCard

    NextActionCard

    WhyThisStatusCard

    PerformanceTrendCard

Use the actual components/patterns discovered in the repository.

Explain:

- existing components to reuse
- new components required
- props
- responsibility boundaries
- view-model mapping

================================================== 11. STATE MANAGEMENT
==================================================

Explain exactly:

- what is true stored UI state
- what is derived
- loading behavior
- error behavior
- selected lift behavior
- trend-tab behavior
- app-focus refresh behavior if applicable
- stale-request prevention

Follow established RackRite patterns.

================================================== 12. DATABASE CHANGES
==================================================

List every proposed database change.

For each:

- why
- query it supports
- migration required
- whether it is truly necessary

"None required" is completely acceptable.

Prefer minimal schema changes.

================================================== 13. TEST PLAN
==================================================

Describe:

- domain unit tests
- repository integration tests
- controller/reducer tests
- view-model tests
- component/UI tests

Use current repository conventions.

Include the important analytical edge cases from this specification.

================================================== 14. IMPLEMENTATION PHASES
==================================================

Break implementation into small executable phases.

For example conceptually:

Phase 1:
data retrieval

Phase 2:
session metrics

Phase 3:
trend engine

Phase 4:
status classification

Phase 5:
diagnosis/recommendation

Phase 6:
controller/view model

Phase 7:
UI implementation based on Stitch

Phase 8:
tests and cleanup

Use a better breakdown if the repository suggests one.

For each phase specify:

- files
- objective
- dependencies
- expected result
- tests

================================================== 15. FILE-BY-FILE PLAN
==================================================

After inspecting the repository, provide the exact proposed paths.

For every file:

- CREATE / MODIFY / DELETE
- purpose
- main exports
- dependency relationships

Do not invent generic paths before inspecting the real structure.

================================================== 16. RISKS AND OPEN QUESTIONS
==================================================

Identify:

- mathematically uncertain areas
- product decisions
- architectural risks
- unreliable training conclusions
- data-quality issues
- UX ambiguity
- anything that should be reviewed before implementation

Be critical.

================================================== 17. DEFERRED FEATURES
==================================================

Clearly separate V1 from later work.

Potential deferred items:

- sophisticated next-set generation
- persistent interventions
- intervention-result tracking
- personal volume-response modeling
- personal frequency modeling
- training blocks
- AI explanations/chat
- adaptive session generation

Do not accidentally implement future scope while building V1.

==================================================
FINAL PRODUCT PRINCIPLE
==================================================

The eventual user experience should be extremely simple.

A user should be able to open Progress and understand:

SQUAT
PROGRESSING

BENCH
STALLING

DEADLIFT
PROGRESSING

Then select BENCH and see:

BENCH PRESS

STALLING

"Your bench progress has slowed across recent training."

NEXT ACTION

"Monitor your next two competition-bench sessions before making a major change."

WHY THIS STATUS

Performance +0.2%
Estimated 1RM +0.4%
Average RPE +0.7
Weekly Volume +16%

"Performance has flattened while effort has increased."

PERFORMANCE TREND

[chart from Stitch design]

The user should not have to interpret ten graphs.

RackRite should interpret the training.

The user should be able to inspect the evidence.

==================================================
MOST IMPORTANT ENGINEERING PRINCIPLE
==================================================

The workout log is the source data.

The Lift Intelligence engine creates meaning from that data.

The Progress screen presents that meaning.

Keep those responsibilities separate.

==================================================
FINAL INSTRUCTION
==================================================

DO NOT BEGIN IMPLEMENTATION.

First:

1. Inspect the repository.
2. Inspect relevant existing RackRite features.
3. Inspect the Stitch MCP Progress screen.
4. Analyze the current architecture and data model.
5. Produce the complete plan described above.

Be critical.

If a requirement here is mathematically weak, architecturally unnecessary, incompatible with existing RackRite patterns, or likely to create misleading training conclusions:

CALL IT OUT.

Propose a better solution.

Do not agree with the specification blindly.

However, preserve these non-negotiable product requirements:

- Progress is focused on competition Squat / Bench / Deadlift
- Stitch MCP screen is the visual source of truth
- existing RackRite architecture/patterns must be followed
- competition-lift performance only in V1
- deterministic Lift Intelligence
- derived analytics
- conservative state classification
- explainable evidence
- actionable recommendations
- RPE optional
- no AI dependency
- minimal focused Progress screen
- future extensibility for next-set recommendations and intervention tracking

Return the planning document only.
Do not write implementation code yet.
