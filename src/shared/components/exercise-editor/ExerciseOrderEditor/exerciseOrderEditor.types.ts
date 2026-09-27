import type { Exercise } from "@/domain/exercises/exercise.types";

export type ExerciseOrderItem = Pick<Exercise, "name" | "kind"> & {
  id: string;
};
