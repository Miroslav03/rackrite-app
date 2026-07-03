# Attempt Planner — UX & Functional Specification

## Purpose

The Attempt Planner is a **support tool** that generates a realistic 3-attempt competition plan based on a target max.

It is designed to:

- Help users choose safe and effective attempts
- Prevent overly aggressive openers
- Provide a clear progression to a goal weight

This tool is **not a workout builder** and **not a persistent entity**.
It is a **decision-making helper**.

---

# Core Principles

- Simple input → clear output
- No over-engineering
- Realistic and safe suggestions
- Context-aware integrations
- No unnecessary configuration

---

# Entry Points

## 1. From Tools Screen (Primary)

Trigger:
- Tap "Attempt Planner"

Behavior:
- Opens full screen planner

---

## 2. From 1RM Calculator

Trigger:
- Tap "Use for Attempt Planner"

Behavior:
- Opens planner with prefilled target max

---

# Inputs

## Required

### Target Max
- Numeric input
- Represents desired third attempt (goal weight)
- Uses global unit system

---

## Optional

### Style
Options:
- Conservative
- Standard (default)
- Aggressive

Purpose:
- Controls how safe or aggressive the first two attempts are

---

# Output

## Attempt Plan

Three attempts:

- Attempt 1 (Opener)
- Attempt 2
- Attempt 3 (Target)

Example:

1st: 180 kg
2nd: 190 kg
3rd: 200 kg

---

## Output Rules

- Always exactly 3 attempts
- Attempts must be strictly increasing
- Third attempt equals target max
- All values must be rounded to valid increments

---

# Generation Logic (High-Level)

## Strategy

- Third attempt = target max
- First and second attempts depend on style

### Conservative
- Opener: ~88–90%
- Second: ~93–95%

### Standard
- Opener: ~90–92%
- Second: ~95–97%

### Aggressive
- Opener: ~92–93%
- Second: ~97–99%

---

## Rounding

- Round all attempts to nearest valid increment (e.g. 2.5 kg)
- Ensure no duplicates after rounding

---

# UI Structure

## Section 1 — Input

- Target Max
- Style selector

---

## Section 2 — Result

Displays:

- 1st attempt
- 2nd attempt
- 3rd attempt

Each attempt is displayed as a separate row

---

## Section 3 — Actions

### Primary
- Copy plan

### Secondary
- Tap attempt → open plate breakdown

---

# Interaction Rules

## Real-time Updates

- Changing target max updates attempts instantly
- Changing style updates attempts instantly

---

## Copy Plan

Copies formatted text:

Attempts (Standard)

1st: 180 kg
2nd: 190 kg
3rd: 200 kg

---

## Plate Breakdown

When user taps an attempt:

- Opens Plate Calculator
- Shows breakdown for selected weight

---

# State Logic

## State: Empty Input

- No attempts shown
- No actions visible

---

## State: Valid Input

- Show all 3 attempts
- Show actions

---

## State: Invalid Input

Examples:
- Empty input
- Negative value
- Target max = 0

Behavior:
- Hide results
- Show inline error

---

# Edge Cases

## 1. Very Low Target

Behavior:
- Still generate valid attempts
- Maintain increasing order

---

## 2. Rounding Collisions

Example:
- 1st and 2nd become equal after rounding

Behavior:
- Adjust second upward
- Maintain strict ordering

---

## 3. Non-standard Plate Availability

Behavior:
- Attempts remain valid numbers
- Plate breakdown handles loadability separately

---

## 4. Extreme Aggressive Style

Behavior:
- Clamp unrealistic values
- Maintain safe progression

---

# Invariants

- Always exactly 3 attempts
- Attempts always increase
- Third attempt equals target max
- Opener is always the safest attempt
- No persistence of plans
- No modification of workout data

---

# What NOT To Do

- Do NOT store attempt history
- Do NOT allow unlimited attempts
- Do NOT add complex strategy settings
- Do NOT integrate directly with workout sets (MVP)
- Do NOT show multiple competing plans

---

# Integration

## With 1RM Calculator

- Accept prefilled target max

---

## With Plate Calculator

- Each attempt can open plate breakdown

---

# Persistence Rules

## Do NOT Persist

- Attempt plans as entities

## Optional

- No persistence required for MVP

---

# Final Rule

**Attempt Planner converts a target max into a simple, safe, and realistic 3-attempt plan without adding complexity or friction.**

