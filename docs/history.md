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

The history list, read-only workout details, and repeat flow are implemented.

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
Tap a card to open its workout details. The bottom-right repeat icon starts the
repeat flow independently of card navigation.

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

## 2. Workout Details Screen — Implemented

The root stack route `/history/[workoutId]` follows Stitch **Workout History
Details - Tinted Set Cards** (`3f600e8279b9486a8690af9b8688b0cf`). The shared header
shows a back icon to the left of the RackRite logo, separated by the `md` gap.

- Show the existing Quick Workout / Template Workout name, local date
  (`SEP 7, 2026`), and whole elapsed minutes.
- Summary cards show total volume, total completed sets (including warm-ups),
  and average recorded RPE across completed non-warm-up sets. Missing RPE is
  excluded from the denominator; no qualifying values displays `—`.
- Each exercise card shows its name and kind: Competition Lift, Lift Variation,
  or Accessory. Exercises without completed sets are omitted.
- Completed sets appear in saved order with consecutive display numbers, set
  type, weight in kg, reps, and RPE. Set-type tints come from shared theme tokens;
  RPE labels and values are white. Large text uses a wrapping labeled layout.
- Reuse SurfaceCard and shared typography; rows have no editing or action controls.
  There is no intensity metric, exercise icon, or device-verification label.
- The shared primary Repeat Workout button stays above the bottom safe area;
  the exercise list scrolls independently above it.

A screen-local controller calls the history details action, which loads the
aggregate through `getWorkoutAggregateById` and passes it to the pure history
selector. Loading, retryable errors, and unavailable-workout states keep back
navigation available. Responses from earlier routes, blurred screens, or unmounted
controllers are ignored.

## 3. Repeat Workout — Implemented

Both entry points use the same history repeat controller and confirmation view.
The history action loads the source by ID, calls the workout domain's
`createRepeatedWorkout`, and persists through the workout repository. The shared
workout session controller owns operation guards and commits React state only
after persistence succeeds.

The new session copies completed sets only (including warm-ups), with their types,
weights, reps, and RPE. Exercises with no completed sets are omitted. Exercise
notes, rest durations, order, and template association are preserved. Workout,
workout-exercise, and set IDs are new; indexes are consecutive; timestamps start
now; every set is unfinished; the rest timer is cleared and the first set is active.
The completed source remains unchanged. A source without completed sets cannot be
repeated.

If a workout is active, the shared DangerModal asks **Discard current workout?**
with Cancel and Discard & Repeat actions. Cancel, backdrop dismissal, and Android
Back do nothing to workout data. Pending confirmation cannot be dismissed.

The repository rechecks the expected active workout ID and atomically deletes
only that confirmed workout and inserts the replacement. The Expo SQLite driver
requires a synchronous transaction callback and synchronous statements. Failures
roll back all changes, retain the active session, and allow retry with toast
feedback. Stale confirmation never deletes a different workout.

Duplicate repeat requests and overlapping session mutations are blocked. Callbacks
from a previous workout cannot mutate its replacement, and the active editor
remounts when the workout ID changes to cancel pending debounced edits.

After success, the history list pushes `/workout`; details replaces its route with
`/workout`. If the initiating screen has lost focus, the session still persists
but does not trigger late navigation. Repeated workouts enter history only when
finished. No schema changes or additional persisted history source are required.

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
