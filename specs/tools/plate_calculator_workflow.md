# Plate Calculator — UX & Interaction Specification

## Purpose

The Plate Calculator is a **support tool** designed to help users determine how to load a barbell based on available plates.

It serves two roles:

1. **Planning tool (Tools screen)**
2. **Execution helper (Workout context)**

This document defines behavior specifically when used in **Workout context** and partially in Tools.

---

# Core Principles

- No friction during workout
- No unnecessary decisions
- No modal confirmations
- Always preserve training flow
- Tools assist, they do NOT interrupt

---

# Entry Points

## 1. From Workout Screen

Trigger:
- Tap on weight value
- OR tap on plate icon

Behavior:
- Opens Plate Calculator as **bottom sheet / inline panel**

Context:
- Active workout MUST exist
- Active set MUST be selected

---

## 2. From Tools Screen

Trigger:
- Tap Plate Calculator item

Behavior:
- Opens full screen calculator

Context:
- No active workout required

---

# Data Sources

## From UserSettings

- unitSystem (kg/lb)
- barWeight
- availablePlates[]

## From Workout (if applicable)

- activeSet.weight

---

# UI Structure (Workout Context)

## Section 1 — Target Weight

- Pre-filled from active set
- Editable (optional, depending on implementation)

## Section 2 — Result

Displays:
- Total weight
- Bar weight
- Plates per side
- Exact match state

### Exact Match Example

95 kg
Bar: 20 kg
Plates per side:
20 + 10 + 2.5

### No Exact Match Example

97.5 kg
No exact match

Closest:
95 kg (-2.5)
100 kg (+2.5)

---

## Section 3 — Actions

### Case 1 — Exact Match

Show:

[ Use in Workout ]

---

### Case 2 — No Exact Match

Show:

[ Use 95 kg ]
[ Use 100 kg ]

Do NOT show:
- Use original (unloadable) weight

---

# Interaction Rules

## Primary Action Behavior

When user taps any "Use" button:

1. Update active set weight
2. Close calculator
3. Keep same set selected
4. Trigger UI feedback

---

## UI Feedback (Required)

- Haptic feedback (light)
- Weight value animation (fade or scale)
- Optional row highlight

---

# State Logic

## State: Idle

- No input or invalid input
- No actions visible

---

## State: Exact Match

- Show breakdown
- Show "Use in workout"

---

## State: No Exact Match

- Show closest values
- Show alternative actions only

---

## State: Invalid Input

Cases:
- Empty input
- Negative weight
- Weight < bar weight

Behavior:
- Hide results
- Show inline error message

---

# Edge Cases

## 1. No Active Workout

Behavior:
- Do NOT show "Use in workout"
- Show only calculation result

---

## 2. No Active Set

Behavior:
- Do NOT show action buttons

---

## 3. Plates Not Configured

Behavior:
- Show message:
  "Set your available plates in Settings"
- Disable calculation

---

## 4. Impossible Load (extreme case)

Example:
- target too small or too large

Behavior:
- Show:
  "Cannot calculate with current setup"

---

## 5. Very Small Weight

Example:
- weight equal to bar

Behavior:
- Show:
  "Bar only"

---

## 6. Floating Precision Issues

Behavior:
- Round to nearest valid plate increment
- Avoid showing decimals like 0.0001

---

## 7. Rapid Input Changes

Behavior:
- Recalculate instantly
- No debounce required (light computation)

---

## 8. User Changes Plates (Future)

If override allowed:
- Recalculate immediately
- Do not persist unless explicitly saved

---

# What NOT To Do

- Do NOT ask "Update or Add set"
- Do NOT create new sets from calculator
- Do NOT show confirmation dialogs
- Do NOT navigate away from workout
- Do NOT persist calculation history

---

# Relationship with Workout Flow

- Calculator ONLY modifies current set
- Set completion flow remains unchanged
- Auto-fill logic remains intact

---

# Relationship with Tools Screen

## Tools Version Adds:

- Editable target weight
- Plate override
- Gym profiles (future)
- Exploration use

## Tools Version Removes:

- "Use in workout" (unless opened from context)

---

# Final Rule

**Plate Calculator updates the current set only, never creates new sets, and never interrupts workout flow.**

