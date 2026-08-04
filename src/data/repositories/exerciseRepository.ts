import { asc, eq } from "drizzle-orm";

import { db } from "@/data/db/client";
import { exercisesTable } from "@/data/db/schema";
import { exerciseRowToExercise } from "@/data/mappers/exerciseMappers";

import type {
  Exercise,
  ExerciseKind,
} from "@/domain/exercises/exercise.types";

export type ExerciseRepository = {
  getExercisesByKind: (kind: ExerciseKind) => Promise<Exercise[]>;
};

export const getExercisesByKind: ExerciseRepository["getExercisesByKind"] =
  async (kind) => {
    const exerciseRows = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.kind, kind))
      .orderBy(asc(exercisesTable.name));

    return exerciseRows.map(exerciseRowToExercise);
  };

export const exerciseRepository: ExerciseRepository = {
  getExercisesByKind,
};
