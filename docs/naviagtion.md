# Powerlifting App — Navigation Architecture Specification

## Purpose

This document defines the **navigation architecture** of the powerlifting application.

The goal of the navigation system is to:

- Provide fast and predictable access to core features
- Keep the UI simple and focused
- Separate navigation (browsing) from action (training)
- Support a distraction-free workout experience

---

## Core Navigation Principles

### 1. Separate Navigation from Action

- Tabs = navigation between sections
- Workout = focused action mode

The workout screen must NOT behave like a normal tab.

---

### 2. Minimize Cognitive Load

- Clear structure
- No deep navigation trees
- No unnecessary screens

---

### 3. Fast Access to Core Action

- Start tab is default
- Workout is 1 tap away

---

### 4. Context-Aware Entry

```
if (activeWorkout exists):
    → open Workout Screen
else:
    → open Start Tab
```

---

## High-Level Architecture

```
Root Navigation
│
├── Tab Navigator
│     ├── Start
│     ├── Templates
│     ├── History
│     ├── Progress
│     └── Settings
│
└── Stack Screens (outside tabs)
      └── Workout Screen
```

---

## Bottom Tab Navigation

### Structure

```
[ Start ] [ Templates ] [ History ] [ Progress ] [ Settings ]
```

---

## Tab Responsibilities

### 1. Start Tab

Purpose:
- Entry point to core action

Contains:
- Start Workout
- Continue Workout (if exists)
- Quick Start
- Start with Template

This is the **default tab on app open** (if no active workout).

---

### 2. Templates Tab

Purpose:
- Manage workout templates

Features:
- View templates
- Create template
- Edit template
- Delete template
- Start workout from template

---

### 3. History Tab

Purpose:
- View past workouts

Features:
- List of workouts
- Workout details
- Basic summaries

---

### 4. Progress Tab

Purpose:
- Show performance metrics

Features:
- PR tracking
- Volume tracking
- Simple trends

---

### 5. Settings Tab

Purpose:
- App configuration

Features:
- Units (kg/lb)
- Bar weight
- Plates
- Backup/export
- Restore purchases

---

## Workout Screen (Critical)

### Key Rule

The Workout Screen is **NOT part of tabs**.

It is a **separate screen in the navigation stack**.

---

### Why

- Prevent distraction
- Maintain focus
- Avoid accidental navigation
- Improve speed

---

### Behavior

When user starts or resumes workout:

```
→ push Workout Screen
→ hide tabs (or visually remove them)
```

---

## Entry Flow

### Case 1: No active workout

```
App Open
→ Start Tab
```

---

### Case 2: Active workout exists

```
App Open
→ Workout Screen (directly)
```

---

## Navigation Flow

### Start Workout

```
Start Tab
→ Select action
→ Workout Screen
```

---

### From Templates

```
Templates Tab
→ Select template
→ Workout Screen
```

---

## Back Navigation Behavior

### From Workout Screen

```
Back Press
→ Return to Start Tab
```

---

### From Start Tab

```
Back Press
→ Exit App
```

---

### From Other Tabs

```
Back Press
→ Default system behavior (or return to Start Tab if needed)
```

---

## Important UX Rules

### 1. Do NOT include Workout as a tab

Bad:
```
[ Start ] [ Workout ] [ History ]
```

Good:
```
Workout = separate screen
```

---

### 2. Hide Tabs During Workout

- Prevent accidental navigation
- Keep focus on training

---

### 3. Avoid Deep Navigation

Do NOT create:
- nested tab structures
- multiple stacked layers unnecessarily

---

### 4. Keep Navigation Predictable

- Back always behaves consistently
- No confusing loops

---

## Edge Cases

### Active Workout Exists

Start tab should show:
- Continue Workout
- Optional: Discard Workout

---

### No Templates

Templates tab:
- Show empty state
- Encourage template creation

---

### App Resume (from background)

```
if activeWorkout:
    → return to Workout Screen
```

---

## UX Goals

Navigation must ensure:

- Fast transitions
- Clear mental model
- No confusion
- No friction
- Immediate access to training

---

## Mental Model

User thinks:

> "I open the app → I train"

Not:

> "Where do I go?"

---

## Final Summary

The navigation system is designed around:

- **Tabs for browsing**
- **Workout for action**

Key ideas:

- Start tab is default entry point
- Workout is a separate full-screen experience
- Navigation is simple, flat, and predictable
- Focus is always on minimizing time to action

---

## Key Statement

**Navigation exists to support training, not to distract from it.**
