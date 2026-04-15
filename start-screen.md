# Powerlifting App — Start Screen & Entry Flow Specification

## Purpose

This document defines the **Start Screen (Home Screen)** and **entry logic** of the powerlifting application.

The goal of this screen is to:

- Minimize time to start a workout
- Provide immediate access to the core action
- Keep UI extremely simple and fast
- Avoid unnecessary navigation or decision-making

---

## Product Philosophy

The application is a **tool**, not a platform.

Users open the app with one primary intent:

> "Start or continue a workout"

The Start Screen must reflect this.

---

## Core Principle

**1 tap to action**

Users should be able to:
- start a workout
- continue a workout

...with minimal friction.

---

## Entry Logic (Critical)

The Start Screen is **not always shown**.

### App Launch Behavior

```
if (activeWorkout exists):
    → Open Workout Screen directly
else:
    → Open Start Screen
```

---

## Start Screen Overview

The Start Screen is a **minimal action screen**, not a dashboard.

### It should contain:

- No complex data
- No heavy UI
- No unnecessary navigation
- Only actions

---

## Start Screen Layout

### Minimal Version

```
START WORKOUT

[ Continue Workout ]   (only if active workout exists)
[ Start with Template ]
[ Quick Start (empty) ]
```

---

## Buttons Description

### 1. Continue Workout

**Visible only if an active workout exists**

Purpose:
- Resume ongoing training session

Behavior:
- Opens Workout Screen with current state

---

### 2. Start with Template

Purpose:
- Start a structured workout based on a saved template

Behavior:
- Opens Template Selection Screen
- User selects template
- App creates workout instance
- Navigates to Workout Screen

---

### 3. Quick Start (Empty Workout)

Purpose:
- Start training immediately without template

Behavior:
- Creates empty workout
- Opens Workout Screen
- User adds exercises manually

---

## Optional Enhancements (Recommended)

### Last Template Shortcut

```
Last Template: Bench Volume Day
[ Start Last Template ]
```

Purpose:
- Reduce friction for repeated usage

---

## Navigation Flow

### Case 1: No active workout

```
App Open
→ Start Screen
→ User selects action
→ Workout Screen
```

---

### Case 2: Active workout exists

```
App Open
→ Workout Screen (directly)
```

---

## Back Navigation Behavior

### From Workout Screen

```
Back Press
→ Start Screen
```

---

### From Start Screen

```
Back Press
→ Exit App
```

---

## Important UX Rules

### 1. No dashboard
Do NOT show:
- graphs
- stats
- summaries

---

### 2. No menu complexity
Do NOT include:
- tabs
- deep navigation
- multiple sections

---

### 3. No forced decisions
Avoid:
- too many buttons
- configuration screens
- unnecessary inputs

---

### 4. Context awareness

The app must adapt:

- If user is training → show workout
- If not → show start options

---

## Edge Cases

### Active workout exists

Start Screen should prioritize:

```
[ Continue Workout ]
[ Discard Workout ] (optional)
```

---

### No templates exist

If user has no templates:

```
[ Quick Start ]
```

---

### User presses back multiple times

Ensure:

- No navigation loops
- Clean exit from app

---

## UX Goals

The Start Screen must achieve:

- Zero confusion
- Instant clarity
- Fast decision-making
- Minimal taps

---

## Mental Model

User should think:

> "I open the app and start training immediately"

Not:

> "Where do I go?"

---

## Final Summary

The Start Screen is a **smart entry point**, not a traditional home screen.

It adapts based on state:

- With active workout → skip it
- Without workout → show simple actions

The entire purpose is to:

- reduce friction
- increase speed
- guide user directly into training

---

## Key Statement

**The Start Screen exists only to bridge the gap between opening the app and starting a workout.**
