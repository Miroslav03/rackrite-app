# Powerlifting App — Template System Specification

## Purpose

This document describes the **template system** for a niche mobile application focused on **powerlifting training tracking**.

The goal of the template system is to provide a **fast, simple, and predictable way** for users to create and start training days built around the three core powerlifting lift families:

- Squat
- Bench
- Deadlift

This system is intentionally **not** designed as a generic fitness planner.  
It is built for a **specific type of user**: powerlifters and strength-focused trainees who want a polished, fast UI/UX and minimal friction during training.

---

## Product Positioning

The application is designed as a **niche powerlifting tool**, not a general workout tracker.

### What it is
- A focused training logger for powerlifting-oriented users
- A tool for fast workout setup and fast set logging
- A product centered around **SBD** (Squat / Bench / Deadlift) and their variations
- A system optimized for **speed**, **clarity**, and **low cognitive load**

### What it is not
- Not a bodybuilding app
- Not a general gym exercise library
- Not a workout content platform
- Not a coach marketplace
- Not a social fitness network

---

## Why Templates Exist

Templates exist to solve several real user problems:

1. **Slow workout setup**  
   Users should not need to manually build the same training day every time.

2. **Repeated structure in powerlifting training**  
   Powerlifting training is usually structured and repetitive. Users often repeat similar training days with small weight changes.

3. **Need for speed during training**  
   A template allows the user to start a session quickly and focus on logging performance instead of rebuilding the workout.

4. **Consistency**
   Templates help users follow a plan and reduce mistakes.

5. **Cleaner UX**
   Templates reduce the number of taps and decisions needed before a workout begins.

---

## Core Mental Model

### Template
A template represents **one training day**.

### Training Day
A training day can contain up to **three exercise groups**, one from each main lift family:

- Squat
- Bench
- Deadlift

Each selected exercise group uses:
- exactly **one chosen variation**
- one or more **set definitions**

### Important rule
A template does **not** support unlimited exercise addition.

This is intentional.

The purpose of the app is to remain:
- focused
- fast
- powerlifting-specific
- easy to use

---

## Template Page Overview

The template page is the part of the app where users can:

- see all saved templates
- create a new template
- edit an existing template
- delete a template
- start a workout from a template

---

## Template List Screen

### Purpose
The template list screen shows all saved templates.

### What the user sees
Each template card or row should contain:

- Template name
- Short summary of included lift groups
- Optional metadata such as:
  - number of included exercise groups
  - last used date
  - total set count

### Example templates
- Bench Volume Day
- Heavy Squat Day
- Deadlift Technique Day
- Peak SBD Day

### Main actions on this screen
- Create new template
- Open template
- Edit template
- Delete template
- Start workout from template

---

## Template Creation / Editing Screen

### Purpose
This screen allows the user to create or edit a training day template.

### High-level structure
A template contains:

1. Template name
2. Up to 3 exercise groups:
   - Squat group
   - Bench group
   - Deadlift group

Each exercise group contains:
- whether it is enabled
- selected variation
- one or more set definitions
- optional notes

---

## Main Rules of the Template System

### Rule 1 — Maximum 3 exercise groups
A template can include at most:
- 1 Squat group
- 1 Bench group
- 1 Deadlift group

### Rule 2 — Each group uses only one selected variation
Example:
- Squat -> Paused Squat
- Bench -> Close Grip Bench
- Deadlift -> Deficit Deadlift

A single template should **not** contain multiple bench variations at the same time in the same initial version.

For example, this should **not** be allowed inside one template:
- Bench Press
- Paused Bench
- Spoto Press

Instead, the user chooses one bench variation for the Bench group.

### Rule 3 — Each selected variation can have many sets
The variation is singular, but it can contain multiple set definitions.

Example:
- Paused Bench
  - 1x3 Top Set
  - 4x5 Backoff Sets

### Rule 4 — Exercise groups are optional
The user does not need to include all three groups.

Examples:
- Bench only
- Squat + Bench
- Bench + Deadlift
- Squat + Deadlift
- Squat + Bench + Deadlift

---

## Template Screen Fields

### 1. Template name
Free text input.

Examples:
- Bench Volume Day
- Heavy Squat Day
- Peak Day
- Deadlift Light Day

### 2. Exercise groups section
The screen should show the three available lift groups:

- Squat
- Bench
- Deadlift

Each group can be:
- enabled
- disabled

### 3. Variation selection
If a group is enabled, the user chooses one variation from that family.

### 4. Set definitions
Each enabled group contains one or more set definitions.

### 5. Optional notes
Each enabled group can contain notes.

Examples:
- "Pause 1 sec at chest"
- "Use belt only on top set"
- "Keep tempo controlled"

---

## Variations by Lift Family

These are the built-in exercise variations supported by the template system.

The app should stay focused and should only support **the 3 main lift families and their relevant powerlifting variations**.

---

## Squat Variations

- Competition Squat
- Paused Squat
- Tempo Squat
- Pin Squat
- Front Squat
- SSB Squat
- High Bar Squat
- Box Squat

### Notes
These variations remain within the powerlifting context and are commonly used to improve competition squat performance.

---

## Bench Variations

- Competition Bench
- Paused Bench
- Close Grip Bench
- Spoto Press
- Tempo Bench
- Larsen Press
- Pin Bench
- Feet Up Bench

### Notes
These cover common bench variations used in powerlifting programs.

---

## Deadlift Variations

- Competition Deadlift
- Pause Deadlift
- Deficit Deadlift
- Block Pull
- Romanian Deadlift
- Snatch Grip Deadlift
- Stiff Leg Deadlift
- Tempo Deadlift

### Notes
These variations support common deadlift-focused strength work.

---

## Set Definitions

A set definition describes the planned structure for a group of sets inside a selected lift variation.

### Why set definitions exist
Powerlifters often do not log a workout as:
- one exercise
- one number of sets
- one number of reps

Instead, a single lift often contains:
- a top set
- backoff sets
- working sets
- warm-up sets

This is why the system must support multiple set definitions for one selected variation.

---

## Supported Set Types

The initial version should support the following set types:

### 1. Warm-up
Used for preparation before heavier work.

Example:
- 20kg x 5
- 40kg x 5
- 60kg x 3

### 2. Working Set
Standard planned work sets.

Example:
- 5 x 5

### 3. Top Set
The heaviest set of the session for that lift.

Example:
- 1 x 3

### 4. Backoff
Lighter sets after a top set.

Example:
- 3 x 5

---

## Optional Future Set Types

These are not required for the first polished version but can be added later if needed:

- Technique Set
- AMRAP
- Drop Set

These should not be part of the first version unless they improve the product without increasing complexity.

---

## Fields Inside a Set Definition

Each set definition should contain:

- Set type
- Number of sets
- Number of reps
- Optional target RPE
- Optional notes

### Example
Paused Bench
- Type: Top Set
- Sets: 1
- Reps: 3
- Target RPE: 8
- Notes: Pause on chest

Paused Bench
- Type: Backoff
- Sets: 4
- Reps: 5
- Target RPE: 7

---

## Example Template Structures

### Example 1 — Bench Volume Day

**Bench**
- Variation: Paused Bench
- Sets:
  - 1 x 3 Top Set
  - 4 x 5 Backoff

**Squat**
- Variation: Tempo Squat
- Sets:
  - 3 x 4 Working Set

**Deadlift**
- Variation: Romanian Deadlift
- Sets:
  - 3 x 6 Working Set

---

### Example 2 — Heavy Squat Day

**Squat**
- Variation: Competition Squat
- Sets:
  - 1 x 3 Top Set
  - 3 x 5 Backoff

**Bench**
- Variation: Competition Bench
- Sets:
  - 5 x 5 Working Set

**Deadlift**
- Disabled

---

### Example 3 — Deadlift Technique Day

**Squat**
- Disabled

**Bench**
- Variation: Paused Bench
- Sets:
  - 3 x 5 Working Set

**Deadlift**
- Variation: Deficit Deadlift
- Sets:
  - 1 x 3 Top Set
  - 3 x 4 Backoff

---

## What the User Can Edit

The user should be able to edit:

### Template-level fields
- Template name

### Exercise-group-level fields
- Enable or disable group
- Chosen variation
- Notes

### Set-definition-level fields
- Set type
- Number of sets
- Number of reps
- Optional target RPE
- Optional notes
- Delete set definition
- Reorder set definitions if needed

---

## What the User Should NOT Be Able to Do in the Initial Version

To keep the system polished and fast, the initial version should **not** allow:

- adding random exercise categories outside SBD families
- adding more than one squat group
- adding more than one bench group
- adding more than one deadlift group
- adding a fourth exercise family
- creating highly advanced programming logic
- percent-based automatic progression logic
- scriptable workout logic
- complex conditional logic
- giant exercise libraries

This keeps the system:
- niche
- easy to understand
- fast to use
- easier to implement well

---

## UX Principles for the Template Screen

The template system must reflect the overall product direction:
**polished, fast, niche, low-friction.**

### UX goals
- Very low cognitive load
- No clutter
- Minimal taps
- Clear structure
- Fast creation flow
- Easy editing
- Easy scanning
- Clear differences between lift family, variation, and sets

### UX guidelines
1. Show only 3 lift families
2. Avoid long searchable exercise catalogs
3. Keep group sections visually distinct
4. Allow fast add/edit/remove of set definitions
5. Make the relationship clear:
   - lift family
   - selected variation
   - set definitions
6. Avoid modal overload
7. Avoid forcing unnecessary input

---

## Why This Design Fits Powerlifters

Powerlifters usually train with:
- few exercises
- many sets
- repeated structure
- planned progression
- high need for fast logging

They do **not** usually need:
- huge workout builders
- bodybuilding-style split planners
- random accessory-heavy libraries
- motivational content platforms during training

This is why the template system is deliberately limited.

The limitation is a strength, not a weakness.

---

## Main Product Benefits of This Template System

This template system helps the app achieve its product goals:

### 1. Fast setup
Users can start a training day quickly.

### 2. Strong focus
The app remains clearly powerlifting-oriented.

### 3. Better UX
The user does not get lost in unnecessary options.

### 4. Better consistency
Training days can follow repeated structure.

### 5. Easier implementation
The system is smaller and easier to polish.

### 6. Better positioning
This helps the app stand apart from generic fitness trackers.

---

## Suggested High-Level UI Structure

### Template List Screen
- Header
- Create Template button
- Template cards/list items

### Template Editor Screen
- Template Name field

#### Squat section
- Enable toggle
- Variation selector
- Set definitions list
- Add set definition button
- Notes field

#### Bench section
- Enable toggle
- Variation selector
- Set definitions list
- Add set definition button
- Notes field

#### Deadlift section
- Enable toggle
- Variation selector
- Set definitions list
- Add set definition button
- Notes field

- Save button
- Delete template button (for edit mode)

---

## Final Summary

The template system is designed around a strict and intentional model:

- One template represents one training day
- A training day can contain up to three exercise groups
- The only supported exercise groups are:
  - Squat
  - Bench
  - Deadlift
- Each enabled group uses one selected variation
- Each selected variation contains one or more set definitions
- Supported set types in the first version are:
  - Warm-up
  - Working Set
  - Top Set
  - Backoff

This system is intentionally constrained in order to create:
- a polished experience
- a fast workflow
- a niche powerlifting tool
- a product with strong clarity and strong differentiation

The core philosophy is:

**Do fewer things, but do them very well.**
