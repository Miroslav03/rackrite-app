import type { Exercise } from "@/domain/exercises/exercise.types";

type CompetitionLiftExercise = Extract<Exercise, { kind: "competition_lift" }>;
type LiftVariationExercise = Extract<Exercise, { kind: "lift_variation" }>;
type AccessoryExercise = Extract<Exercise, { kind: "accessory" }>;

export const COMPETITION_LIFT_EXERCISES = [
  {
    id: "competition_squat",
    name: "Competition Squat",
    kind: "competition_lift",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "competition_bench",
    name: "Competition Bench",
    kind: "competition_lift",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "competition_deadlift",
    name: "Competition Deadlift",
    kind: "competition_lift",
    origin: "built_in",
    liftFamily: "deadlift",
  },
] satisfies CompetitionLiftExercise[];

export const LIFT_VARIATION_EXERCISES = [
  // Squat variations
  {
    id: "paused_squat",
    name: "Paused Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "tempo_squat",
    name: "Tempo Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "pin_squat",
    name: "Pin Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "front_squat",
    name: "Front Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "ssb_squat",
    name: "SSB Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "high_bar_squat",
    name: "High Bar Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },
  {
    id: "box_squat",
    name: "Box Squat",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "squat",
  },

  // Bench variations
  {
    id: "paused_bench",
    name: "Paused Bench",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "close_grip_bench",
    name: "Close Grip Bench",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "spoto_press",
    name: "Spoto Press",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "tempo_bench",
    name: "Tempo Bench",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "larsen_press",
    name: "Larsen Press",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "pin_bench",
    name: "Pin Bench",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "feet_up_bench",
    name: "Feet Up Bench",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "incline_bench",
    name: "Incline Bench Press",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },
  {
    id: "touch_and_go_bench",
    name: "Touch and Go Bench",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "bench",
  },

  // Deadlift variations
  {
    id: "paused_deadlift",
    name: "Paused Deadlift",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
  {
    id: "deficit_deadlift",
    name: "Deficit Deadlift",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
  {
    id: "block_pull",
    name: "Block Pull",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
  {
    id: "romanian_deadlift",
    name: "Romanian Deadlift",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
  {
    id: "snatch_grip_deadlift",
    name: "Snatch Grip Deadlift",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
  {
    id: "stiff_leg_deadlift",
    name: "Stiff Leg Deadlift",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
  {
    id: "tempo_deadlift",
    name: "Tempo Deadlift",
    kind: "lift_variation",
    origin: "built_in",
    liftFamily: "deadlift",
  },
] satisfies LiftVariationExercise[];

export const ACCESSORY_EXERCISES = [
  // Back
  {
    id: "barbell_row",
    name: "Barbell Row",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "chest_supported_row",
    name: "Chest Supported Row",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "pull_up",
    name: "Pull-Up",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },

  // Chest, shoulders and triceps
  {
    id: "overhead_press",
    name: "Overhead Press",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "dumbbell_bench_press",
    name: "Dumbbell Bench Press",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "dip",
    name: "Dip",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "triceps_pushdown",
    name: "Triceps Pushdown",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "overhead_triceps_extension",
    name: "Overhead Triceps Extension",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "face_pull",
    name: "Face Pull",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "lateral_raise",
    name: "Lateral Raise",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },

  // Legs and posterior chain
  {
    id: "leg_press",
    name: "Leg Press",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "bulgarian_split_squat",
    name: "Bulgarian Split Squat",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "leg_curl",
    name: "Leg Curl",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "hip_thrust",
    name: "Hip Thrust",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
  {
    id: "back_extension",
    name: "Back Extension",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },

  // Core
  {
    id: "ab_wheel",
    name: "Ab Wheel",
    kind: "accessory",
    origin: "built_in",
    liftFamily: null,
  },
] satisfies AccessoryExercise[];
