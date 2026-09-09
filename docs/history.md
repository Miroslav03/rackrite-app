# Powerlifting App — History Screen Specification

## Purpose

The History area allows users to:

- view completed workouts
- quickly recall previous training sessions
- open full details of a past workout
- repeat a past workout if desired

This area is focused on **fast recall and reflection**, not editing.

---

## Core Philosophy

History is a **read-only view over completed workouts**.

It should help the user answer questions like:

- What did I do last time?
- What variation did I run?
- What were my sets?
- Do I want to repeat this workout?

> History is for quick recall, not deep interaction.

---

## Scope

This document covers:

1. History List Screen
2. Workout Details Screen
3. History interaction rules
4. Empty states
5. Repeat Workout behavior

The History list is implemented. Workout details and repeat behavior below are
future specifications.

---

## Mental Model

History is not a separate source of truth.

History is a **view derived from completed workouts**.

That means:

- active workouts do not appear here
- only completed workouts appear here
- workout details shown in history are read-only

---

## 1. History List Screen — Implemented

The list follows the Stitch screen **History - Badged Ledger with Top Sets**.
It is read-only. Opening details and repeating a workout are future features;
there are no inactive action buttons on these cards.

### Header and cards

The standard app header and History screen heading display the global completed
workout count, queried separately from the loaded page.

Each shared `TemplateSurfaceCard` displays:

- The existing Quick Workout / Template Workout name and whole elapsed minutes.
  Names and descriptions are not currently persisted, so descriptions are omitted.
- Shared badges for lift families with completed sets, including variations,
  deduplicated in exercise order. Accessories have no lift-family badge.
- Every exercise with completed sets in workout order: name, completed-set count,
  heaviest completed non-warm-up set, and nonzero counts by set type.
- Relative local calendar day, total lifted weight, and local start date/time
  (24-hour clock). There are no separate date-group headers.

All counts and metrics exclude skipped sets, which may remain in a completed
workout. Top-set ties use reps and then earliest set order; sessions with only
warm-ups use the heaviest completed warm-up. The explicit Top set type does not
take precedence over heavier non-warm-up sets.

Total lifted weight is the sum of `weight × reps` for every completed set,
including warm-ups. Duration is `max(0, floor((finishedAt - startedAt) / 60000))`.
Relative days use local calendar dates, so midnight and daylight-saving changes
are handled independently of elapsed hours. Labels update on focus, foreground,
and local midnight. Zero weights remain valid values.

Badges reuse shared set-type presentation colors from the Workout screen and
always include text. Card content wraps for narrow screens and enlarged text.

### Data flow and pagination

`route -> History controller -> actions`

Actions coordinate the two independent responsibilities, following the workout
action pattern:

- `historyRepository` queries SQLite and maps rows to workout aggregates. It owns
  filtering, ordering, cursor pagination, batched hydration, and the global count.
- Pure domain selectors take completed workout aggregates and derive summaries:
  completed-set counts, total lifted weight, top sets, lift families, and duration.

`loadHistoryPage` validates the page request, fetches aggregates from the repository,
and passes them to the domain selector. `loadHistoryOverview` combines the first
page with the global count. These are feature actions; the domain has no repository
dependency or asynchronous loading use case. Page-size and cursor validation belong
to the loading action, while completed-workout requirements belong to the domain.

History has screen-local state; it does not share active-workout session state
or create another persisted source of truth. Only derived summaries are retained
in the controller after each page is loaded.

- Fetch 50 completed workouts with non-null finish timestamps, ordered by
  `finishedAt DESC, id DESC`.
- Use a `(finishedAt, workoutId)` cursor and a 51st parent row to detect another
  page. Hydrate only the returned 50 workouts using three batched child queries.
- Support the query with `idx_workouts_history` on `(status, finished_at, id)`,
  included in `0000_init` and its snapshot while the app is preproduction.
  Existing development databases require recreation to receive this init change.
- Place FlatList in `Screen scroll={false}`; render three items initially and
  three per batch with `windowSize={5}`. This is not a three-mounted-card limit.
- Load another page at `onEndReachedThreshold={0.5}`. Prevent duplicate requests,
  deduplicate appended IDs, and stop when there is no next cursor.
- Reload the first page and global count on focus, foreground, or pull-to-refresh.
  Replace pages and reset scrolling only after successful refresh.
- Ignore stale responses after refresh, blur, backgrounding, or unmount.

### Loading, errors, and empty history

Initial loading uses the shared full-screen loader. Initial failure offers Retry.
Refresh and pagination failures preserve existing cards and offer explicit retries;
a failed pagination request does not restart automatically on repeated end events.

The empty state reads “No workouts yet” and “Finish your first session to build
your history.” Its “Go to Start” button returns to the Start tab.

---

## 2. Workout Details Screen — Future

### Purpose

The Workout Details Screen shows the full details of a single completed workout.

It is a read-only screen that helps the user inspect:

- variation used
- sets performed
- reps and weight
- structure of the session

---

### Core Rule

Workout Details is **read-only**.

The user should not edit a completed workout from this screen.

---

### High-Level Structure

The screen contains:

- Header
- One section per completed workout section
- Set list per section
- Optional footer actions

---

### Header

Recommended fields:

- Date
- Optional workout name
- Optional duration

---

### Example Header

Apr 10  
Bench Volume Day  
45 min

---

## Section Layout

Each completed workout section should display:

- Lift family
- Selected variation
- Completed set list

---

### Example Section

BENCH — Paused Bench

Set 1   80 kg   5  
Set 2   85 kg   5  
Set 3   90 kg   3

---

### Important Rule

The details screen should visually resemble the Workout Screen enough to feel familiar, but without interactive controls.

That means:

- same basic section logic
- similar reading structure
- but no sticky action bar
- no editing actions
- no inline mutations

---

## Set Display

Each set row should display:

- set index
- optional set type label
- weight
- reps

---

### Example

Set 1   Warm-up   60 kg   5  
Set 2   Top Set   90 kg   3  
Set 3   Backoff   80 kg   5

---

### Rules

- show completed values only
- keep rows simple
- no edit affordances
- no selected/active state

---

## Optional Highlighting

The details screen may highlight:

- Top Set
- Best notable set in this workout

Example:

Top Set → 90 x 3

This is optional, but useful.

---

## Optional Footer

The footer may contain lightweight actions such as:

[ Repeat Workout ]

This is recommended for convenience.

---

## 3. Repeat Workout Behavior — Future

### Purpose

Allow the user to quickly start a new workout based on a previous completed workout.

---

### Trigger

From Workout Details:

[ Repeat Workout ]

---

### Behavior

When the user chooses Repeat Workout:

- create a new active workout
- copy workout structure into a new workout instance
- open Workout Screen
- treat this as a new workout, not a reopened history entry

---

### Important Rule

Repeat Workout does NOT modify the original completed workout.

The original history item remains immutable.

---

## 4. What History Should NOT Do

History should NOT:

- edit completed workouts
- show active workouts
- behave like Progress
- become a heavy analytics dashboard
- contain cluttered charts

Charts and deep metrics belong in Progress, not in History.

---

## 5. UX Rules

### 1. History must be fast to scan
The user should recognize recent workouts in under a second per item.

### 2. Details must be familiar
Workout Details should resemble the workout layout, but be clearly read-only.

### 3. No confusion with active workouts
History is only for completed sessions.

### 4. No accidental edit paths
Completed workouts are immutable in History.

### 5. Keep mental model simple
History = past workouts  
Progress = analysis  
Workout = action

---

## 6. Data / Domain Interpretation

History is derived from:

- Workout
- WorkoutExercise
- WorkoutSet

Where:

- Workout.status = completed

This means History is a **view**, not a separate source of truth.

---

## 7. Key Differentiators

The History area should feel better than generic fitness apps because it is:

- powerlifting-specific
- variation-aware
- fast to scan
- closely aligned with Workout structure
- lightweight and focused

---

## Final Summary

The History area exists to help the user:

- quickly recall completed training
- review exact workout details
- repeat previous sessions easily

It should remain:

- read-only
- fast
- minimal
- predictable

---

## Key Statement

**History is a clean read-only view of completed workouts, optimized for quick recall and repeatability.**
