# Warm-up Builder — UX & Functional Specification

## Purpose

The Warm-up Builder is a **support tool** that generates a sequence of warm-up sets leading up to a target working weight.

It is designed to:

- Remove decision-making before lifting
- Provide a structured warm-up progression
- Reduce fatigue from poor warm-up planning
- Speed up workout execution

This tool is **not a planner** and **not a persistent entity**.
It is a **one-click preparation utility**.

---

# Core Principles

- Minimal input → immediate output
- No complex configuration
- Context-aware behavior
- Fast application to workout or template
- No interruption to workout flow

---

# Entry Points

## 1. From Workout Screen (Primary)

Trigger:
- Tap "Generate warm-up" inside an exercise section

Behavior:
- Opens Warm-up Builder as bottom sheet

Context:
- Active workout exists
- Specific exercise section is known

---

## 2. From Tools Screen

Trigger:
- Tap "Warm-up Builder"

Behavior:
- Opens standalone screen

Context:
- No exercise selected

---

## 3. From Template Editor

Trigger:
- Tap "Generate warm-up" inside a lift group

Behavior:
- Opens builder with template context

---

# Inputs

## Required

### Target Weight
- Numeric input
- Represents intended working/top set weight
- Uses global unit system

---

## Optional

### Warm-up Style
Options:
- Short
- Standard (default)
- Extended

Purpose:
- Controls number of sets and progression smoothness

---

## Derived Inputs (from settings)

- Bar weight
- Available plates

These are NOT user-editable in this screen

---

# Output

## Warm-up Set List

A sequence of sets with:
- Weight
- Reps

Example:

20 × 8
60 × 5
100 × 3
120 × 2
135 × 1

---

## Output Rules

- Weights must be loadable using available plates
- Values must be rounded to nearest valid plate configuration
- Reps decrease as weight increases

---

# Generation Logic (High-Level)

## Strategy

- Start from empty bar or low %
- Gradually increase intensity
- Reduce reps as intensity increases
- End close to target weight (not equal)

---

## Example Percent Model (internal only)

- ~20% → 8 reps
- ~40% → 5 reps
- ~60% → 3 reps
- ~75% → 2 reps
- ~90% → 1 rep

Then:
- Round each value to loadable weight

---

# UI Structure

## Section 1 — Inputs

- Target Weight
- Warm-up Style selector

---

## Section 2 — Preview

Displays generated warm-up sets

Each row contains:
- Weight
- Reps

---

## Section 3 — Actions

### In Workout Context

Primary CTA:
- Apply to [Exercise Name]

---

### In Template Context

Primary CTA:
- Apply to Template

---

### In Tools Context

No "Apply" button

Optional actions:
- Copy

---

# Interaction Rules

## Real-time Updates

- Changing target weight updates preview instantly
- Changing style updates preview instantly

---

## Apply Behavior

When user taps Apply:

### In Workout

1. Create new sets
2. Set type = Warm-up
3. Insert before working sets
4. Close builder

---

### In Template

1. Create set definitions
2. Set type = Warm-up
3. Attach to selected lift group
4. Close builder

---

# Placement Logic (Workout)

## If no sets exist
- Insert all warm-up sets

## If sets exist
- Insert before first non-warm-up set

---

# State Logic

## State: Empty Input

- No preview
- No actions

---

## State: Valid Input

- Show warm-up sets
- Show appropriate actions

---

## State: Invalid Input

Examples:
- Empty target
- Negative weight
- Target < bar weight

Behavior:
- Hide preview
- Show inline error

---

# Edge Cases

## 1. Target equals bar weight

Output:

Bar × 10

---

## 2. Very low target weight

Output:

Minimal sets only

---

## 3. Very high target weight

Behavior:
- Add more intermediate steps
- Keep progression smooth

---

## 4. Non-loadable weights

Behavior:
- Adjust to nearest loadable value

---

## 5. Existing warm-up sets

Behavior:
- Do NOT remove existing sets
- Add new ones

---

## 6. No active exercise (Tools context)

Behavior:
- Hide Apply button

---

# What NOT To Do

- Do NOT ask user to select exercise
- Do NOT ask for number of sets directly
- Do NOT expose raw percentages in UI
- Do NOT overwrite existing workout data
- Do NOT store builder results as entities

---

# Persistence Rules

## Do NOT Persist

- Generated warm-up sets as standalone data

## Persist Only When Applied

- Sets become part of Workout or Template

---

# Integration

## With Workout

- Adds sets to active exercise
- Does not modify existing sets

---

## With Template

- Adds warm-up definitions to lift group

---

## With Plate Logic

- Uses plate rounding logic
- Ensures loadable values

---

# Final Rule

**Warm-up Builder generates a ready-to-use sequence of sets and applies them directly to the current context without asking unnecessary questions.**

