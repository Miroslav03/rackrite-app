import type {
  ExerciseRow,
  NewExerciseRow,
} from "@/data/db/schema";

import type { Exercise } from "@/domain/exercises/exercise.types";

export function exerciseToRow(exercise: Exercise): NewExerciseRow {
  return {
    id: exercise.id,
    name: exercise.name,
    kind: exercise.kind,
    origin: exercise.origin,
    liftFamily: exercise.liftFamily,
    defaultRestSeconds: exercise.defaultRestSeconds,
  };
}

export function exerciseRowToExercise(exerciseRow: ExerciseRow): Exercise {
  const { id, name, kind, origin, liftFamily, defaultRestSeconds } =
    exerciseRow;

  switch (kind) {
    case "competition_lift":
      if (origin !== "built_in") {
        throw new Error(
          `Invalid exercise row "${id}": competition lifts must be built in`,
        );
      }

      if (liftFamily === null) {
        throw new Error(
          `Invalid exercise row "${id}": competition lifts must have a lift family`,
        );
      }

      if (defaultRestSeconds === null) {
        throw new Error(
          `Invalid exercise row "${id}": competition lifts must have a default rest duration`,
        );
      }

      return {
        id,
        name,
        kind,
        origin,
        liftFamily,
        defaultRestSeconds,
      };

    case "lift_variation":
      if (liftFamily === null) {
        throw new Error(
          `Invalid exercise row "${id}": lift variations must have a lift family`,
        );
      }

      return {
        id,
        name,
        kind,
        origin,
        liftFamily,
        defaultRestSeconds,
      };

    case "accessory":
      if (liftFamily !== null) {
        throw new Error(
          `Invalid exercise row "${id}": accessories cannot have a lift family`,
        );
      }

      return {
        id,
        name,
        kind,
        origin,
        liftFamily,
        defaultRestSeconds,
      };

    default:
      throw new Error(`Invalid exercise row "${id}": unknown kind "${kind}"`);
  }
}
