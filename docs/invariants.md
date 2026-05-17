## Workout 
 - has maximum of 3 workout sections
 - has at most 1 section per LiftFamily
 - Non-empty workout always has an active set
 - Completed workout is read-only 
 - Workout instance never mutates source template
 - only one set can be active at a time
 - if all sets are completed, the last set remains the active/selected set
 - only one WorkoutSet can be active at a time within a workout

## WorkoutSection
 - belongs to exactly 1 Workout
 - has exactly 1 Variation
 - Variation family must match Section LiftFamily

## WorkoutSet
 - belongs to exactly 1 WorkoutSection
 - has a SetType
 - has a valid setIndex (order in section)
 - weight and reps can be null before completion
 - once marked as done, weight and reps should be defined
 - belongs to exactly one Workout through its section   

 - has a positive number of reps
 - weight must be non-negative when defined

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