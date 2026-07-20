import type { LiftFamily } from "@/domain/domain.types";

export type ExerciseId = string;

export type ExerciseOrigin = "built_in" | "custom";
export type ExerciseKind = "competition_lift" | "lift_variation" | "accessory";
export type Exercise =
  | (BaseExercise & {
      kind: "competition_lift";
      origin: "built_in";
      liftFamily: LiftFamily;
    })
  | (BaseExercise & {
      kind: "lift_variation";
      origin: ExerciseOrigin;
      liftFamily: LiftFamily;
    })
  | (BaseExercise & {
      kind: "accessory";
      origin: ExerciseOrigin;
      liftFamily: null;
    });

interface BaseExercise {
  id: ExerciseId;
  name: string;
}
