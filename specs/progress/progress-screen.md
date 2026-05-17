# Powerlifting App — Progress Screen Specification

## Purpose

The **Progress** screen helps the user quickly understand one thing:

> Am I getting stronger on this lift / variation?

This screen is not a complex analytics dashboard. It is a simple powerlifting progress view that shows the most important information for the selected lift and variation.

The user should understand their progress in under **3 seconds**.

---

## Core Principles

Progress should be:

- **Simple** — no unnecessary analytics
- **Clear** — every card should have an obvious purpose
- **Actionable** — the user should know what happened and what to try next
- **Variation-specific** — Competition Bench, Paused Bench, etc. should not be mixed
- **Honest** — do not show fake readiness/fatigue scores if the app does not log RPE

---

## Final Screen Structure

The final Progress screen contains these sections in this order:

1. App header
2. Screen title
3. Lift selector
4. Variation selector
5. Personal Record card
6. Trend card
7. Weekly Volume card
8. Recent Sessions
9. Recent PRs
10. Bottom navigation

---

# 1. App Header

## What it shows

Top app header with:

- Menu icon on the left
- App name / logo in the center-left area
- Profile/settings avatar on the right

## Purpose

This keeps the screen consistent with the rest of the app.

---

# 2. Screen Title

## UI copy

```text
PROGRESS
PERFORMANCE ANALYTICS AND TRENDS
```

## Purpose

This tells the user they are looking at performance data, not workout logging or history.

---

# 3. Lift Selector

## UI

Segmented control:

```text
Squat | Bench | Deadlift
```

## Behavior

- The selected lift controls all data below it.
- Default can be `Bench` or the last selected lift.
- Switching the lift updates:
  - variation list
  - PR card
  - trend card
  - weekly volume
  - recent sessions
  - recent PRs

## Important rule

The lift selector chooses the **lift family**:

```text
Bench
Squat
Deadlift
```

It does not select the exact variation. The exact variation is selected below.

---

# 4. Variation Selector

## UI example

```text
Variation
Competition Bench ⌄
```

## Purpose

The variation selector tells the app exactly which exercise data to show.

Example:

```text
Bench → Competition Bench
Bench → Paused Bench
Bench → Close Grip Bench
```

## Behavior

- Shows only variations from the selected lift family.
- Opens a dropdown or bottom sheet.
- When the user selects a variation, all progress data below updates.

## Critical rule

Do **not** mix variations.

Example:

```text
Competition Bench data ≠ Paused Bench data
Paused Squat data ≠ Competition Squat data
```

This is important because different variations have different strength levels.

---

# 5. Personal Record Card

## Purpose

This is the main card of the screen.

It answers:

```text
What is my best current performance for this selected variation?
```

## UI example

```text
Personal Record                       Progressing

100 kg
× 3 reps

Estimated 1RM: 110 kg

Recommended Next
Try 102.5 kg × 3
```

## What it shows

### 1. Personal Record

The best recorded set for the selected variation.

Example:

```text
100 kg × 3 reps
```

### 2. Estimated 1RM

Estimated 1 rep max calculated from the best or selected top set.

Example:

```text
Estimated 1RM: 110 kg
```

### 3. Status badge

Example:

```text
Progressing
```

Possible states:

```text
Progressing
Plateau
Regressing
Not enough data
```

### 4. Recommended Next

Simple next target suggestion.

Example:

```text
Try 102.5 kg × 3
```

## Important UX note

Because the app does **not** log RPE, the recommendation should not sound too certain.

Better copy examples:

```text
Suggested Next
102.5 kg × 3
```

or

```text
Next Target
102.5 kg × 3
```

Avoid overly confident logic like:

```text
You should increase weight
```

The app does not know if the last set was easy or a grind.

---

# 6. Trend Card

## Purpose

The trend card shows how performance is changing over time.

It answers:

```text
Is my top performance going up, flat, or down?
```

## UI structure

The selector stays at the top of the card:

```text
Top Set | e1RM | Volume
```

Then the selected trend label and chart are shown below.

Example:

```text
Top Set | e1RM | Volume

Top Set Trend
[chart]
```

## Trend selector options

### 1. Top Set

Shows the best/top set from each recent session.

Example data:

```text
90 × 5
92.5 × 5
95 × 4
100 × 3
```

This is very useful because powerlifters care about top-set progression.

### 2. e1RM

Shows estimated 1RM trend over time.

This is useful because it compares different rep ranges.

Example:

```text
95 × 5 may estimate higher than 100 × 2
```

### 3. Volume

Shows volume trend for the selected variation.

Volume formula:

```text
volume = weight × reps
```

For a session:

```text
session volume = sum of all completed sets for that variation
```

## Why not call it “Intensity Trend”?

Avoid using “Intensity Trend” as the main label because the app does not log RPE.

Without RPE, the app knows weight and reps, but it does not know how hard the set felt.

Better labels:

```text
Top Set Trend
Estimated 1RM Trend
Volume Trend
```

---

# 7. Weekly Volume Card

## Purpose

The Weekly Volume card shows how much work the user is doing for the selected variation over the last 8 weeks.

It answers:

```text
How much total work am I doing recently?
```

## UI example

```text
Weekly Volume                         +12%
Last 8 weeks

[bar chart]

Total this week: 2,840 kg
```

## What it shows

### 1. Weekly Volume title

```text
Weekly Volume
```

### 2. Time range

```text
Last 8 weeks
```

### 3. Change badge

Example:

```text
+12%
```

This compares current week volume against previous week volume.

### 4. Mini bar chart

Shows volume for each of the last 8 weeks.

### 5. Total this week

Example:

```text
Total this week: 2,840 kg
```

## Calculation

For every completed set in the selected variation:

```text
set volume = weight × reps
```

For each week:

```text
weekly volume = sum of all set volume in that week
```

## Important product rule

More volume is not always better.

Because the app does not track RPE, fatigue, sleep, or recovery, the volume card should be neutral and analytical, not overly motivational.

That is why the `+12%` badge can be styled more neutrally instead of looking like a strong green success badge.

---

# 8. Recent Sessions

## Purpose

Recent Sessions shows the latest workouts for the selected variation.

It answers:

```text
What happened in my last sessions for this variation?
```

## UI example

```text
Recent Sessions                                      View All

Oct 24, 2023        95.5 kg × 4
Heavy Single        Vol: 382.0 kg
+2.5 kg

Oct 21, 2023        92.5 kg × 8
Volume Accumulation Vol: 740.0 kg
+2.5 kg

Oct 17, 2023        90.0 kg × 5
Backoff Sets        Vol: 450.0 kg
```

## Each row shows

- Date
- Session note / protocol name
- Top set
- Session volume for selected variation
- Small comparison badge when useful

## Comparison badge examples

```text
+2.5 kg
Same
-2.5 kg
PR
```

## Important rule

Recent Sessions are **not PRs**.

They are simply the latest training sessions for the selected variation.

---

# 9. Recent PRs

## Purpose

Recent PRs shows recent personal record improvements for the selected variation.

It answers:

```text
Which records did I recently improve?
```

## UI example

```text
Recent PRs

125 kg × 1           Oct 24
New Max Weight

100 kg × 3           Oct 10
New 3RM

110.0 kg e1RM        Sep 28
New Estimated 1RM
```

## Important distinction

Recent PRs are **not** calculated by volume.

Example:

```text
100 kg × 2 = 200 kg volume
125 kg × 1 = 125 kg volume
```

Even though `100 × 2` has more volume, `125 × 1` is still the more important strength PR because it is the heaviest weight lifted.

## PR types

### 1. New Max Weight

The heaviest weight ever lifted for the selected variation.

Example:

```text
125 kg × 1
New Max Weight
```

### 2. New Rep Max

The best weight for a specific rep count.

Examples:

```text
100 kg × 3
New 3RM

90 kg × 5
New 5RM
```

Each rep count has its own record:

```text
1RM
2RM
3RM
5RM
8RM
```

### 3. New Estimated 1RM

The highest estimated 1RM calculated from a completed set.

Example:

```text
110.0 kg e1RM
New Estimated 1RM
```

### 4. Volume PR — optional / lower priority

Volume PR can exist, but it should not dominate the Recent PRs section.

Strength PRs are more important for this app.

Priority order:

```text
1. New Max Weight
2. New Rep Max
3. New Estimated 1RM
4. Volume PR
```

## Duplicate PR rule

One set can break multiple records at the same time.

Example:

```text
125 kg × 1
```

This could be:

```text
New Max Weight
New 1RM
New Estimated 1RM
```

But the UI should not show three rows for the same set.

Show only the strongest/clearest event:

```text
125 kg × 1
New Max Weight
```

This keeps the screen clean.

---

# 10. Bottom Navigation

## UI

```text
Start | Templates | History | Progress | Settings
```

## Behavior

- Progress tab is active.
- Navigation stays consistent with the rest of the app.

---

# Data Matching Rules

## Critical matching rule

All progress data is calculated per:

```text
Lift family + exact variation
```

Example:

```text
Bench + Competition Bench
Bench + Paused Bench
Squat + Competition Squat
Deadlift + Competition Deadlift
```

## Do not mix data

Do not combine:

```text
Competition Bench + Paused Bench
Competition Squat + Front Squat
Competition Deadlift + Romanian Deadlift
```

This prevents misleading progress numbers.

---

# Main Calculations

## 1. Set Volume

```text
set volume = weight × reps
```

Example:

```text
100 kg × 3 = 300 kg volume
```

## 2. Session Volume

```text
session volume = sum of all completed sets for selected variation in one workout
```

## 3. Weekly Volume

```text
weekly volume = sum of all selected-variation session volume in one calendar week
```

## 4. Estimated 1RM

Recommended simple formula for MVP:

```text
e1RM = weight × (1 + reps / 30)
```

For single reps:

```text
if reps = 1, e1RM = weight
```

Example:

```text
100 kg × 3
100 × (1 + 3 / 30) = 110 kg e1RM
```

## 5. Max Weight PR

A set is a new max weight PR if:

```text
set.weight > previous best max weight
```

## 6. Rep Max PR

A set is a new rep max if:

```text
set.weight > previous best weight for that exact rep count
```

Example:

```text
100 kg × 3 beats previous 3RM of 97.5 kg × 3
```

## 7. e1RM PR

A set creates a new e1RM PR if:

```text
calculated e1RM > previous best e1RM
```

---

# Status Logic

Status should be simple and conservative.

## Progressing

Use when recent top sets, e1RM, or rep maxes are improving.

Example:

```text
Recent sessions show higher top set or higher e1RM.
```

## Plateau

Use when performance is mostly unchanged across multiple recent sessions.

Example:

```text
Same top set for 3+ sessions.
```

## Regressing

Use when recent performance is clearly lower.

Example:

```text
Top set or e1RM decreased across recent sessions.
```

## Not enough data

Use when the selected variation does not have enough completed sessions.

Example:

```text
Less than 3 completed sessions.
```

---

# Recommendation Logic

## Purpose

Recommendation should give the user a simple next target.

## Examples

```text
Suggested Next
102.5 kg × 3
```

```text
Next Target
100 kg × 4
```

```text
Repeat Last Target
100 kg × 3
```

## Important rule

Do not make the recommendation too confident because the app does not log RPE.

Avoid:

```text
You should increase weight
```

Prefer:

```text
Suggested Next
Try 102.5 kg × 3
```

---

# Screen States

## 1. No Data State

Shown when there are no completed sets for the selected variation.

### UI copy

```text
No data yet
Log your first Competition Bench session to see progress.
```

Optional CTA:

```text
Start Workout
```

---

## 2. Low Data State

Shown when there is some data, but not enough for reliable trends.

### UI copy

```text
Not enough data yet
Log at least 3 completed sessions for this variation to see reliable trends.
```

Use this for charts/status if the user has too little history.

---

## 3. No PRs State

Shown inside Recent PRs when there are sessions but no detected PRs yet.

### UI copy

```text
No PRs yet
Complete more sets to start tracking records.
```

---

# UX Rules

## Keep the screen clean

Do not add too many filters or dropdowns on the main Progress screen.

The main screen already has:

```text
Lift selector
Variation selector
Trend selector
```

Do not add another PR-type dropdown on the main screen.

## Recent PRs should be automatic

The main screen should show the latest important PRs automatically.

Detailed filters can exist later in a separate `View All` / detail screen, but not on the main screen.

## Avoid fake analytics

Do not add:

```text
Readiness score
Fatigue score
Recovery score
RPE distribution
```

unless the app actually logs the required data.

Since RPE is not logged, these metrics would be misleading.

## Preserve hierarchy

Visual importance should be:

```text
1. Personal Record card
2. Trend card
3. Weekly Volume card
4. Recent Sessions
5. Recent PRs
```

The PR card should remain the main focal point.

---

# Design Notes From Final Screen

## Overall style

- Dark premium powerlifting aesthetic
- Large bold PR number
- Compact uppercase labels
- Card-based layout
- Consistent margins, gaps, and padding
- Rounded cards
- Muted borders and subtle accents
- Blue used as the main active/accent color
- Green used only for progress/positive PR signals
- Weekly Volume uses a more neutral/muted accent because volume increase is not always automatically good

## Weekly Volume card

- Keep the left accent border subtle, not harsh bright white
- `+12%` badge should be neutral/muted white style
- Badge should align to the right side of the card header using space-between layout

## Recent PRs icons

- Trophy/achievement icon works better than abstract medals
- Keep icons compact and subtle
- Icons should support the row, not dominate it

---

# What This Screen Avoids

The Progress screen should avoid:

- Complex analytics dashboards
- Too many charts
- Too many dropdowns
- Mixing variations
- Making volume look like the main strength metric
- Fake fatigue/readiness scoring
- Noisy PR duplication
- Overconfident recommendations without RPE

---

# Simple Mental Model

When opening the screen, read it like this:

```text
1. Which lift am I looking at?
Bench

2. Which variation?
Competition Bench

3. What is my best result?
100 kg × 3

4. What is my estimated max?
110 kg e1RM

5. Am I progressing?
Progressing

6. What is trending?
Top Set / e1RM / Volume

7. How much work did I do this week?
2,840 kg

8. What happened recently?
Recent Sessions

9. What records did I break recently?
Recent PRs
```

---

# Final Summary

The Progress screen should show the user:

- Their best current performance
- Their estimated 1RM
- Whether they are progressing
- A simple next target
- Top set / e1RM / volume trends
- Weekly volume
- Recent sessions
- Recent personal records

The screen should stay simple, direct, and powerlifting-specific.

---

## Key Statement

**Progress should not just show data. It should tell the user what the data means.**
