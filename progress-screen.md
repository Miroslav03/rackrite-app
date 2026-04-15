# Powerlifting App — Progress Screen Specification

## Purpose

The Progress screen allows users to:

- Track strength development over time
- View performance for specific lifts and variations
- Understand if they are improving, plateauing, or regressing
- Get simple, actionable suggestions

This screen is critical for **user retention and monetization**.

---

## Core Philosophy

Progress should be:

- Simple
- Clear
- Actionable

> The user should understand their progress in under 3 seconds.

---

## High-Level Structure

The Progress screen consists of:

1. Lift Selector (S / B / D)
2. Variation Selector
3. Content Area (dynamic)
   - Progress View (if data exists)
   - Empty State (if no data)

---

## 1. Lift Selector

A segmented control with 3 options:

[ Bench ] [ Squat ] [ Deadlift ]

### Behavior

- Default selection: Bench (or last selected)
- Switching changes the entire content below
- No navigation — same screen, dynamic content

---

## 2. Variation Selector

Dropdown placed below lift selector.

### Example

Competition Bench ⌄

### Behavior

- Shows variations only for selected lift
- Opens bottom sheet or dropdown
- User selects variation → content updates

---

## Variation Data Source

Variations should include only those relevant to the lift:

### Bench
- Competition Bench
- Paused Bench
- Close Grip Bench
- Spoto Press
- Tempo Bench
- Larsen Press
- Pin Bench
- Feet Up Bench

### Squat
- Competition Squat
- Paused Squat
- Tempo Squat
- Pin Squat
- Front Squat
- SSB Squat
- High Bar Squat
- Box Squat

### Deadlift
- Competition Deadlift
- Pause Deadlift
- Deficit Deadlift
- Block Pull
- Romanian Deadlift
- Snatch Grip Deadlift
- Stiff Leg Deadlift
- Tempo Deadlift

---

## 3. Content Area

### State A — No Data

Shown when there is no workout history for selected variation.

### UI Example

Paused Bench

No data yet  
Log your first session for this variation to unlock progress insights.

[ Start Workout ]

---

### Behavior

- No charts or numbers shown
- Clear message
- Optional CTA to start workout

---

## State B — Progress View

Shown when data exists.

---

## Layout

### Header

Variation name

Example:

Competition Bench

---

### Key Metrics

Best: 100 kg x 3  
Last: 95 kg x 3  

---

### Status Indicator

Status: Progressing  
(or Plateau / Regressing)

---

### Trend Insight

+5 kg improvement in last 2 weeks  
or  
No progress in last 3 sessions  

---

### Recent Sessions

List of last workouts for this variation.

Example:

Apr 10 → 95 x 3  
Apr 7  → 92.5 x 3  
Apr 5  → 90 x 3  

---

### Suggestion (Important)

Simple actionable guidance.

Examples:

Increase weight by +2.5 kg next session  
Repeat same weight  
Reduce load by -5 kg  

---

## Data Logic

### Matching Rule (Critical)

Progress is calculated per:

- Lift family (Bench / Squat / Deadlift)
- Variation (exact match)

---

### Important Rule

DO NOT mix different variations.

Example:

- Paused Bench data is separate from Competition Bench

---

## Best Set Calculation

Best = highest performance based on:

- highest weight for given reps
OR
- strongest top set

---

## Last Set

Last = most recent session data for selected variation

---

## Status Logic (Simplified)

### Progressing
- Increasing weight or reps over last sessions

### Plateau
- Same performance across multiple sessions

### Regressing
- Decreasing performance

---

## Suggestion Logic (Simple Version)

Based on recent trend:

- Progressing → suggest increase
- Plateau → suggest repeat
- Regressing → suggest decrease

---

## UX Rules

1. No clutter
2. No complex charts (optional later)
3. Clear hierarchy:
   - Best
   - Last
   - Status
   - History
4. Fast switching between lifts
5. No heavy interactions

---

## What This Screen Avoids

- Complex analytics dashboards
- Overloaded graphs
- Mixing variations
- Confusing metrics

---

## Optional Future Enhancements

- Small graph (secondary)
- PR highlight
- Volume tracking
- Advanced suggestions

---

## Final Summary

The Progress screen provides:

- Clear insight into strength development
- Variation-specific tracking
- Actionable feedback

---

## Key Statement

**Progress should tell the user what it means, not just show data.**
