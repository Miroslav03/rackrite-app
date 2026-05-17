# Powerlifting App — Workout Screen Specification (Updated)

## Purpose

This document defines the **Workout Screen**, the most critical part of the application.

The goal of this screen is to:

- Enable ultra-fast set logging
- Minimize user thinking and interaction cost
- Provide a clean, distraction-free training experience
- Support real-world powerlifting workflows

---

## Core Philosophy

The workout screen is not a dashboard.

It is a **real-time training tool**.

> The user should be able to log a set in 2–3 seconds.

---

## High-Level Structure

1. Header
2. Exercise Sections (SBD)
3. Set List
4. Sticky Action Bar (context-aware)

---

## Header

- Workout name (optional)
- Workout duration
- Rest timer (if active)

---

## Exercise Sections

Up to 3 sections:

- Squat
- Bench
- Deadlift

Each section contains:

- Lift name
- Selected variation (editable via dropdown)
- List of sets

---

## Variation Selector

Each exercise section supports changing variation via dropdown:

Example:

BENCH — Competition Bench ⌄

Tap opens selector:

- Competition Bench
- Paused Bench
- Close Grip Bench
- etc.

### Behavior

- Change is immediate
- Sets remain unchanged
- No confirmation required

---

## Default Variations

When user selects a lift in empty state:

- Squat → Competition Squat
- Bench → Competition Bench
- Deadlift → Competition Deadlift

---

## Set Structure

Each set:

- Index
- Type
- Weight
- Reps
- Done status

---

## Active Set

There is ALWAYS an active set (except empty state).

Rules:

- On start → first set selected
- On Done → next set selected
- On tap → selected changes
- When all done → last stays selected

---

## Sticky Action Bar

Context-aware bottom bar with 3 states.

---

## State 1 — Empty Workout

UI:

No workout yet  

[ Bench ] [ Squat ] [ Deadlift ]

### Behavior:

On tap:

- Create exercise
- Assign default variation
- Create first set
- Select it
- Switch to Normal State

---

## State 2 — Normal (Active Set)

UI:

Editing Set X  

[ +2.5 ] [ +5 ] [ +10 ] [ Copy ]

---

## State 3 — All Sets Completed

UI:

All sets completed ✓  

[ Finish Workout ] [ Add Set ]

---

## Set Interaction Flow

### Logging

1. Adjust values (optional)
2. Press Done

### On Done

- Mark set complete
- Select next set
- Auto-fill next set

---

## Auto-Fill Logic

When a set is completed:

next.weight = current.weight  
next.reps = current.reps  

---

## Prefill Logic (IMPORTANT)

Prefill is based on **variation match**, not full workout.

### Matching Rules

For each exercise:

1. Match by lift family (Bench/Squat/Deadlift)
2. Match by variation (e.g. Competition Bench)

### Behavior

- If exact variation match exists → prefill from last session
- If no match → leave weight empty
- DO NOT fallback to different variation

### Example

Last workout:
- Paused Bench = 90 x 5

New workout:
- Competition Bench

→ DO NOT prefill from Paused Bench

---

## Template Behavior

Templates are NOT modified during workouts.

### Rule:

Template → copied → workout instance

### During workout:

- User can change anything
- Template remains unchanged

---

## Variation Changes During Workout

If user changes variation:

- Only variation label updates
- Sets remain
- No confirmation

---

## Finish Workout Behavior

### No modal confirmation

When user taps:

[ Finish Workout ]

### App:

- Saves instantly
- Returns to Start Screen
- Shows snackbar:

Workout saved ✓ [Undo]

---

## Undo Behavior

If user taps Undo:

- Restore workout
- Return to workout screen

---

## Empty Set Values

If no history:

— kg  
— reps  

If history exists:

Prefill matching variation

---

## UX Rules

1. No modals for core actions
2. Always visible primary actions
3. Context-aware UI
4. No dead states
5. One-hand usage

---

## What This Screen Avoids

- Exercise search
- Complex menus
- Confirm dialogs
- Clutter

---

## Key Differentiators

1. SBD-focused structure
2. Variation-aware prefill
3. Ultra-fast logging
4. Smart autofill
5. Context-aware sticky bar
6. Minimal UI

---

## Final Summary

The workout screen:

- Minimizes friction
- Matches real training
- Uses intelligent defaults
- Stays predictable

---

## Key Statement

**Workout is a live session, not a form — speed and clarity are the priority.**


---

## Bar Weight Usage (Global)

### Purpose
Define how bar weight is used across the app.

### Rules

- Bar weight is a **global setting** (configured in Settings)
- Applies to all workouts, exercises, and sets
- Used only for **plate breakdown visualization**
- Does NOT affect stored weights

---

### Behavior

User enters:

Set 2 → 80 kg

This value is always treated as **total weight (including bar)**

---

### Plate Breakdown Interaction

Trigger:

- User taps on weight value (e.g. 80 kg)

---

### UI Example

80 kg

Bar: 20 kg  
Plates per side:  
20 + 10

---

### Data Source

- Bar weight → from Settings
- Available plates → from Settings

---

### Important Constraints

- Changing bar weight does NOT modify:
  - Past workouts
  - Stored set values
- Only affects future plate calculations

---

### UX Rules

- Must be accessible in 1 tap from workout screen
- Must not interrupt workout flow
- Must be dismissible instantly

---

### Key Principle

Bar weight affects **visual guidance**, not **training data**.
