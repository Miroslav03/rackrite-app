import { db } from "../client";
import { exercisesTable } from "../schema";

import {
    ACCESSORY_EXERCISES,
    COMPETITION_LIFT_EXERCISES,
    LIFT_VARIATION_EXERCISES,
} from "./exercises.seed";

export async function seedDatabase(): Promise<void> {
  await db
    .insert(exercisesTable)
    .values([
      ...COMPETITION_LIFT_EXERCISES,
      ...LIFT_VARIATION_EXERCISES,
      ...ACCESSORY_EXERCISES,
    ])
    .onConflictDoNothing({
      target: exercisesTable.id,
    });
}
