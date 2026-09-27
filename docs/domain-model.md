## Core Entities
Workout 
WorkoutSection - active sections
WorkoutSet - active sets 
Template
TemplateExercise - planned exercises
TemplateSet - individual planned sets

## Reference Entities
Variation

## Configration Object
UserSettings - for now belongs to the app/phone device since no AUTH

## Value Types/Enums
LiftFamily - Bench, Deadlift, Squat
SetType -  Тop, Backoff, Working, Warmup
WorkoutStatus - completed, active
UnitSystem - kg, lbs

## Derived Concepts/ Views
ProgressView
HistoryView

BestSet
PlateBreakdown
RecentSessions
ProgressStatus

## Relations
Workout has many WorkoutSection
WorkoutSection belongs to Workout 
WorkoutSection has many WorkoutSet
WorkoutSet belongs to WorkoutSection
WorkoutSection refrences one Variation

Template has many TemplateExercise
TemplateExercise belongs to Template
TemplateExercise has many TemplateSet
TemplateSet belongs to TemplateExercise
TemplateExercise references one Exercise definition
