# 🧰 Tools Screen – Product & Architecture Specification

## 🎯 Purpose

The **Tools screen** provides quick access to essential **powerlifting utilities** that support training decisions and execution.

> These are not workouts, not history, not templates —
> they are **standalone helpers used before, during, or after training**.

---

# 🧭 Position in Navigation

## Bottom Tab

* Start
* History
* Progress
* **Tools** ✅
* Settings

---

# Tools Overview (MVP)

Simple, practical descriptions of each tool, including purpose, inputs, states, and invariants.

---

# 1. Plate Calculator

## Purpose

Convert a target weight into a **real, loadable plate configuration**.

## Input

* Target weight
* Uses bar weight + available plates (from settings)

## Output

* Plates per side
* Exact match OR closest options

## States

* Empty → no result
* Valid (exact) → show breakdown + `Use in workout`
* Valid (no exact) → show closest weights + `Use X kg`
* Invalid → error (weight < bar)

## Invariants

* Always uses available plates
* Never shows impossible weight
* Returns ONE clear solution (no multiple combos)

---

# 2. 1RM Calculator

## Purpose

Estimate max strength from a performed set.

## Input

* Weight
* Reps

## Output

* Estimated 1RM
* Practical percentages (85 / 90 / 95 / 100%)

## States

* Empty → no result
* Valid → show 1RM + percentages + actions
* Invalid → error (weight <= 0, reps <= 0)

## Actions

* Copy result
* Use for Attempt Planner
* Use for Warm-up Builder

## Invariants

* Uses ONE formula (default: Epley)
* Does NOT store results
* Always instant calculation

---

# 3. Warm-up Builder

## Purpose

Generate a **ready-to-use warm-up sequence** for a target weight.

## Input

* Target weight
* Style (Short / Standard / Extended)
* Uses bar weight + plates (from settings)

## Output

* Sequence of sets (weight × reps)

Example:
20 × 8
60 × 5
100 × 3
120 × 2
135 × 1

## States

* Empty → no sequence
* Valid → show sequence + actions
* Invalid → error (target < bar)

## Actions

* Copy sequence
* Apply to workout (only if context exists)

## Context Rules

* From Workout → apply to current exercise
* From Tools → no apply button
* From Template → apply to template

## Invariants

* Always plate-loadable weights
* Always progressive (weight ↑ reps ↓)
* Never overwrites existing sets
* Never asks user “where to apply”

## Edge Cases

* target < bar → error
* target == bar → bar-only set
* weird plates → rounded to valid values

---

# 4. Attempt Planner

## Purpose

Generate a **simple, realistic 3-attempt competition plan** based on a target max.

## Input

* Target max  
* Style (Conservative / Standard / Aggressive)  

## Output

* Attempt 1 (opener / safest)  
* Attempt 2 (moderate / realistic)  
* Attempt 3 (target max)  

Example:
1st: 180 kg  
2nd: 190 kg  
3rd: 200 kg  

## States

* Empty → no result  
* Valid → show 3 attempts + actions  
* Invalid → error (target max <= 0)  

## Actions

* Copy plan  
* Tap attempt → open plate breakdown  

## Context Rules

* From Tools → standalone planner  
* From 1RM Calculator → prefill target max  
* Does NOT apply directly to workout sets  

## Invariants

* Always exactly 3 attempts  
* Attempts are always strictly increasing  
* Third attempt always equals target max  
* First attempt is always the safest  
* Always uses realistic jumps  
* Does NOT store results  

---

# Global Tool Rules

* Tools are **stateless by default**  
* No history stored  
* Fast → no multi-step flows  
* Context-aware (workout vs tools)  
* Always produce **usable results, not theory**  

---

# Final Principle

**Each tool should take one input and immediately produce a decision-ready output.**