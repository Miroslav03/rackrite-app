## Workout

- Can contain any number of workout exercises.
- Can contain at most one competition-lift exercise per `LiftFamily`:
  - One Competition Squat.
  - One Competition Bench.
  - One Competition Deadlift.
- Can contain any number of lift-variation exercises, including multiple variations from the same `LiftFamily`.
- Can contain any number of accessory exercises.
- A non-empty workout always has an active set.
- Only one `WorkoutSet` can be active/selected at a time within a workout.
- If all sets are completed, the last set remains active/selected.
- A completed workout is read-only.
- A workout instance never mutates its source template.

## WorkoutExercise

- Belongs to exactly one `Workout`.
- References exactly one `Exercise` definition.
- Has a positive integer rest-duration snapshot.
- Owns any number of workout sets.

## Exercise kinds in a workout

- A `competition_lift` has a `LiftFamily`; its family must be unique among the workout's other competition lifts.
- A `lift_variation` has a `LiftFamily`, but its family does not need to be unique within a workout.
- An `accessory` has no `LiftFamily` and is not subject to a per-family uniqueness restriction.

## WorkoutSet

- Belongs to exactly one `WorkoutExercise` and therefore exactly one `Workout`.
- Has a `SetType`.
- Has a valid `setIndex` matching its order within the workout exercise.
- Weight and reps can be null before completion.
- Once marked as completed, weight and reps must be defined.
- Reps must be a positive whole number when defined.
- Weight must be non-negative when defined.
- RPE must be a whole number from 1 through 10 when defined.

## Template 
 - always has a name
 - has at most 3 sections
 - has at least 1 section
 - has at most 1 section per LiftFamily
 - can be used for starting a workout only if it has at least 1 valid TemplateSection

## TemplateSection
 - belongs to exactly 1 Template
 - has exactly 1 Variation
 - Variation family must match Section LiftFamily
 - must have at least 1 TemplateSetDefinition

## TemplateSetDefinition
 - belongs to exactly 1 TemplateSection
 - has a SetType
 - has a valid setIndex (order in section)
 - has a positive number of sets
 - has a positive number of reps

## UserSettings
belongs to app/device context
there is at most one active UserSettings record per app/device context
UnitSystem is either kg or lbs
BarWeight is global
BarWeight must be non-negative
Changing BarWeight does not modify historical workout data
Available plates, if configured, must be non-negative values
Default rest time, if configured, must be positive
Auto rest timer is boolean
Haptic feedback setting is boolean
