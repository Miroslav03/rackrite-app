# 1RM Calculator — UX & Functional Specification

## Purpose

The 1RM Calculator is a **support tool** that helps the user estimate max strength from a performed set.

It is designed to solve practical questions such as:

- How strong am I based on this set?
- What is my estimated 1RM?
- What training percentages should I use next?
- Should I send this value into Attempt Planner or Warm-up Builder?

This tool is **not** a workout entity and **not** a data record on its own.  
It is a calculation utility that turns one set into practical decisions.

---

# Core Principles

- Fast and simple
- No coaching overload
- No complex analytics inside the tool
- Immediate result from minimal input
- Useful both standalone and contextually

---

# Roles of the Tool

## 1. Standalone Tool (Tools Screen)

User manually enters set data and gets an estimated 1RM.

## 2. Contextual Tool (Workout / History / Progress)

User opens the calculator from an existing set and the input is prefilled automatically.

---

# Entry Points

## 1. From Tools Screen

Trigger:
- Tap `1RM Calculator`

Behavior:
- Opens full tool screen

Context:
- No workout required

---

## 2. From Workout Screen

Trigger:
- Tap a completed set
- OR tap contextual action on a set

Behavior:
- Opens quick calculator sheet or full calculator
- Inputs are prefilled from the selected set

Context:
- Completed set must have valid weight and reps

---

## 3. From History Details

Trigger:
- Tap a past completed set

Behavior:
- Opens calculator with prefilled values

---

## 4. From Progress

Behavior:
- e1RM may be used behind the scenes for progress metrics
- Full calculator may also be opened from a lift detail view

---

# Inputs

## Required Inputs

### Weight
- Numeric
- Positive
- Represents total lifted weight
- Uses current app unit system

### Reps
- Integer
- Positive
- Must be at least 1

---

## Optional Input (Recommended for V1.1)

### Formula
Available options:
- Epley
- Brzycki

Default:
- Epley

Note:
- V1 can ship with Epley only

---

# Output

## Primary Output

### Estimated 1RM
Example:
- `Estimated 1RM: 116.7 kg`

This is the main result and should be the most visually prominent element.

---

## Secondary Output

### Practical Training Percentages

Recommended:
- 85%
- 90%
- 95%
- 100%

Example:
- 85% → 99 kg
- 90% → 105 kg
- 95% → 111 kg
- 100% → 116.7 kg

These values exist to make the result immediately useful.

---

## Optional Supporting Text

Example:
- `Based on 100 kg × 5`
- `Best used as an estimate, not a guaranteed max`
- `Lower-rep sets give more reliable estimates`

This text should remain short and non-intrusive.

---

# Formula Logic

## Default Formula

### Epley
`e1RM = weight × (1 + reps / 30)`

Example:
- 100 × 5
- e1RM = 116.7

---

## Optional Future Formula

### Brzycki
`e1RM = weight × 36 / (37 - reps)`

Do not expose many formulas in V1.

---

# UI Structure

## Section 1 — Header

Title:
- `1RM Calculator`

Subtitle (optional):
- `Estimate max strength from a set`

---

## Section 2 — Inputs

Contains:
- Weight input
- Reps input
- Optional formula selector

Behavior:
- Result updates instantly when input becomes valid
- No calculate button required

---

## Section 3 — Main Result

Contains:
- Estimated 1RM

This section should be visually dominant.

---

## Section 4 — Practical Percentages

Contains:
- 85%
- 90%
- 95%
- 100%

Should be displayed as a clean list or compact cards.

---

## Section 5 — Actions

### Standalone Actions
- `Copy Result`
- `Use for Attempt Planner`
- `Use for Warm-up Builder`

### Contextual Actions
- `Open Attempt Planner`
- `Open Warm-up Builder`

Optional:
- `Use as target max`

---

# Interaction Rules

## Result Calculation

When inputs are valid:
1. Compute estimated 1RM
2. Compute percentage values
3. Show available actions

---

## Copy Result

When user taps `Copy Result`:
- Copy e1RM value
- Optionally copy input summary too

Example copied text:
- `100 × 5 → Estimated 1RM: 116.7 kg`

---

## Send to Attempt Planner

When user taps:
- `Use for Attempt Planner`

Behavior:
- Open Attempt Planner
- Prefill target max with e1RM result

---

## Send to Warm-up Builder

When user taps:
- `Use for Warm-up Builder`

Behavior:
- Open Warm-up Builder
- Prefill target max or working weight suggestion

---

# States

## State 1 — Empty

Condition:
- No input entered yet

Behavior:
- Show inputs only
- Hide result and actions

---

## State 2 — Valid Input

Condition:
- Weight and reps are valid

Behavior:
- Show estimated 1RM
- Show practical percentages
- Show actions

---

## State 3 — Invalid Input

Examples:
- Empty weight
- Empty reps
- Negative weight
- Reps = 0
- Non-numeric input

Behavior:
- Hide results
- Show inline validation
- Do not show actions

---

# Validation Rules

## Weight
- Must be a positive number
- Cannot be zero
- Cannot be negative

## Reps
- Must be a positive whole number
- Cannot be zero
- Cannot be negative

---

# Edge Cases

## 1. Reps Too High

If reps are very high:
- e.g. 15+

Behavior:
- Still calculate if allowed
- Show helper note:
  `High-rep sets are less reliable for 1RM estimation`

Optional product rule:
- Allow reps up to 15 or 20
- Beyond that show warning or disable

Recommended:
- Allow up to 15 in V1

---

## 2. Decimal Reps

Behavior:
- Not allowed
- Reps must be integer only

---

## 3. Decimal Weight

Behavior:
- Allowed
- Respect current unit system
- Round displayed outputs cleanly

---

## 4. Floating Precision Noise

Behavior:
- Round output for display
- Do not show ugly values like 116.6666667

Recommended display:
- 1 decimal place for e1RM
- rounded practical percentages based on current unit logic

---

## 5. Contextual Open from Incomplete Set

Condition:
- Set has missing weight or reps

Behavior:
- Do not open contextual 1RM calculation
- OR open with missing values and no result

Recommended:
- Hide contextual trigger unless set is complete

---

## 6. Formula Change

If formula selector exists:
- Recalculate instantly on change
- Do not persist calculation history

---

## 7. Unit System Changes

Behavior:
- Use current global unit system
- Update labels instantly
- Calculation uses current displayed values

---

# Integration Rules

## With Workout

- Can open from completed set
- Prefills weight and reps
- Does not modify workout data directly

---

## With History

- Can open from past set
- Prefills weight and reps
- Read-only relationship

---

## With Progress

- e1RM can be reused for progress indicators
- Progress should be derived from real set data, not from manual calculator history

---

## With Attempt Planner

- 1RM result can be used as planner base

---

## With Warm-up Builder

- 1RM result can be used to derive training percentages and warm-up targets

---

# Persistence Rules

## Do NOT Persist

Do not store:
- Manual 1RM calculations as independent records
- Calculator history

## May Persist

Optional:
- Last selected formula
- Only as lightweight local preference

## Derived Persistence

Allowed:
- Progress system may derive e1RM from real workout sets
- This is separate from tool history

---

# What NOT To Do

- Do NOT make this a complex science dashboard
- Do NOT show too many formulas in V1
- Do NOT add long educational content inside the tool
- Do NOT store manual calculations as workout records
- Do NOT force extra steps before showing result

---

# Recommended V1 Scope

## Include
- Weight input
- Reps input
- Estimated 1RM
- 85 / 90 / 95 / 100% values
- Copy result
- Send to Attempt Planner
- Send to Warm-up Builder

## Exclude
- RPE-aware estimation
- Advanced fatigue logic
- Large charts
- Historical comparison inside calculator
- Multi-formula overload

---

# Final Rule

**The 1RM Calculator should turn one completed set into an immediate and usable strength estimate, without adding friction or complexity.**
