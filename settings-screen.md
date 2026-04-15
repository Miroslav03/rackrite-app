# Powerlifting App — Settings Screen Specification

## Purpose

The Settings screen allows users to:

- Configure units and lifting preferences
- Customize bar and plate setup
- Manage basic app behavior
- Access support and data options

This screen is simple but important for **correct data input and user comfort**.

---

## Core Philosophy

Settings should be:

- Minimal
- Practical
- Easy to understand

> Only include settings that directly affect the training experience.

---

## High-Level Structure

Settings screen consists of sections:

1. Units
2. Equipment
3. Workout Behavior
4. Data & Account (basic)
5. About

---

# 1. Units

## Purpose

Define measurement system.

## Options

Unit System:

[ KG ] [ LB ]

---

## Behavior

- Applies globally
- Updates all screens instantly
- Stored persistently

---

# 2. Equipment

## Bar Weight

Input or selector:

Bar Weight:

[ 20 kg ] (default)

---

## Plate Configuration (optional V1.1)

Defines available plates for calculator.

Example:

- 20 kg
- 15 kg
- 10 kg
- 5 kg
- 2.5 kg
- 1.25 kg

---

## Behavior

- Used in plate calculation (future feature)
- Not required for V1 MVP

---

# 3. Workout Behavior

## Auto Rest Timer

Toggle:

Auto-start rest timer after set completion

[ ON / OFF ]

---

## Default Rest Time

Input:

Default Rest:

[ 90 sec ]

---

## Behavior

- Starts automatically when set is marked done
- User can override manually

---

## Haptic Feedback

Toggle:

Haptic feedback on actions

[ ON / OFF ]

---

# 4. Data & Account

## Export Data (future)

[ Export Workouts ]

---

## Backup / Restore (future)

- Cloud sync (optional later)

---

## Clear Data (danger)

[ Reset App Data ]

---

### Behavior

- Requires confirmation
- Deletes all workouts and templates

---

# 5. About

## App Version

Version 1.0

---

## Feedback

[ Send Feedback ]

---

## Rate App

[ Rate App ]

---

# UX Rules

1. Keep screen short
2. Group logically
3. Avoid deep navigation
4. Use toggles and simple inputs
5. Avoid advanced configuration in V1

---

# What This Screen Avoids

- Complex profile systems
- Social features
- Over-customization
- Non-essential options

---

# Final Summary

Settings should:

- support training
- not distract from core app
- be quick to scan and adjust

---

## Key Statement

**Settings exist to support the workout — not to become a product on their own.**
