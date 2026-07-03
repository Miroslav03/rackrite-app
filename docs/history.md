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

---

## Mental Model

History is not a separate source of truth.

History is a **view derived from completed workouts**.

That means:

- active workouts do not appear here
- only completed workouts appear here
- workout details shown in history are read-only

---

## 1. History List Screen

### Purpose

The History List Screen shows all completed workouts in a simple, scannable list.

The user should be able to open the screen and recognize recent training sessions immediately.

---

### High-Level Structure

The screen contains:

- Header
- Grouped workout list
- Empty state (if no workouts exist)

---

### Header

Example:

History

---

### Data Source

History list items are derived from:

- completed Workouts
- their WorkoutSections
- their WorkoutSets

Only workouts with status = completed are shown here.

---

### Grouping

History items should be grouped by date.

Recommended grouping:

- TODAY
- YESTERDAY
- older calendar dates (e.g. APR 10)

This makes the list easier to scan and closer to the user's mental model.

---

### Workout List Item

Each item should be compact and easy to scan.

A history item should show:

- workout date (implicit via grouping)
- optional workout name
- lift summary
- optional highlight (top set / best notable set)

---

### Example Item

Bench · Squat · Deadlift  
Top: Bench 90 x 3

---

### Alternative Item

Bench Volume Day  
Bench · Squat  
Top: Paused Bench 85 x 5

---

### Rules for List Items

- maximum 2 lines of core content
- do not overload with too much data
- quick scan is more important than completeness
- list should remain lightweight even with many entries

---

### Tap Behavior

Tap on a history item:

→ opens Workout Details Screen

---

### Optional Long Press (Future)

Optional later actions:

- Delete workout
- Save as template
- Duplicate

These are not required for V1.

---

## Empty State — No History

### When it appears

Shown when the user has no completed workouts yet.

---

### UI Example

No workouts yet  
Start your first session to build your history

[ Start Workout ]

---

### Goal

The empty state should:

- explain why the screen is empty
- point the user back to the core action
- avoid feeling dead or broken

---

## Scroll / Performance Rules

History can grow over time, so:

- use vertical scrolling
- use list virtualization (e.g. FlatList)
- avoid rendering the full history eagerly
- keep list items lightweight

---

## 2. Workout Details Screen

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

## 3. Repeat Workout Behavior

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
- WorkoutSection
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
