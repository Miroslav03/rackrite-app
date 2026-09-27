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

- An in-memory draft may have a blank name or no exercises.
- Saving requires a nonblank name and at least one exercise with valid sets.
- Names are trimmed; duplicate names are allowed. Blank descriptions become null.
- Competition lifts are unique per LiftFamily; variations and accessories are unrestricted.
- Exercise IDs and set IDs are unique within their respective aggregate collections.
- Exercise and set indexes are contiguous, zero-based, and match their array order.
- Domain mutations preserve the input aggregate, record IDs, and creation times.
- Deleting a saved template leaves workouts and their sourceTemplateId untouched.

## TemplateExercise

- Belongs to exactly one Template and references its aggregate Exercise definition.
- Has a positive integer rest-duration snapshot and at least one valid TemplateSet.
- Optional notes are trimmed; blank notes become null.
- Replacing its exercise definition preserves sets, notes, and rest unless explicitly edited.
- Removing its last set removes the exercise. Remaining records are reindexed.

## TemplateSet

- Belongs to exactly one TemplateExercise.
- Represents one planned set, with no weight, completion state, or set-count field.
- Has a supported SetType and positive whole-number reps.
- Optional RPE is null or a whole number from 1 through 10.
- Can be reordered only within its parent exercise.

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
