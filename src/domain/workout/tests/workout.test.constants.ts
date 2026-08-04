import type { Exercise } from "@/domain/exercises/exercise.types";

export const competitionBench: Exercise = {
  id: "competition_bench",
  name: "Competition Bench",
  kind: "competition_lift",
  origin: "built_in",
  liftFamily: "bench",
  defaultRestSeconds: 180,
};

export const competitionSquat: Exercise = {
  id: "competition_squat",
  name: "Competition Squat",
  kind: "competition_lift",
  origin: "built_in",
  liftFamily: "squat",
  defaultRestSeconds: 180,
};

export const competitionDeadlift: Exercise = {
  id: "competition_deadlift",
  name: "Competition Deadlift",
  kind: "competition_lift",
  origin: "built_in",
  liftFamily: "deadlift",
  defaultRestSeconds: 180,
};

export const pausedBench: Exercise = {
  id: "paused_bench",
  name: "Paused Bench",
  kind: "lift_variation",
  origin: "built_in",
  liftFamily: "bench",
  defaultRestSeconds: 120,
};

export const closeGripBench: Exercise = {
  id: "close_grip_bench",
  name: "Close Grip Bench",
  kind: "lift_variation",
  origin: "built_in",
  liftFamily: "bench",
  defaultRestSeconds: 120,
};

export const barbellRow: Exercise = {
  id: "barbell_row",
  name: "Barbell Row",
  kind: "accessory",
  origin: "built_in",
  liftFamily: null,
  defaultRestSeconds: 90,
};
