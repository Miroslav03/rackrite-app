## Core Entities
Workout 
WorkoutSection - active sections
WorkoutSet - active sets 
Template
TemplateSection - predefined sections
TemplateSetDefinition - predefined sets

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

Template has many TemplateSection
TemplateSection belongs to Template
TemplateSection has many TemplateSetDefinition
TemplateSetDefinition belongs to TemplateSection
TemplateSection refrences one Variation
