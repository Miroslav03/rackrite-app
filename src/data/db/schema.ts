import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import type { LiftFamily, SetType } from "@/domain/domain.types";
import type {
  ExerciseKind,
  ExerciseOrigin,
} from "@/domain/exercises/exercise.types";
import type { WorkoutStatus } from "@/domain/workout/workout.types";

export const exercisesTable = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").$type<ExerciseKind>().notNull(),
  origin: text("origin").$type<ExerciseOrigin>().notNull(),
  liftFamily: text("lift_family").$type<LiftFamily>(),
});

export const workoutsTable = sqliteTable("workouts", {
  id: text("id").primaryKey(),
  sourceTemplateId: text("source_template_id"),
  status: text("status").$type<WorkoutStatus>().notNull(),
  activeSetId: text("active_set_id"),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const workoutExercisesTable = sqliteTable(
  "workout_exercises",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workoutsTable.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercisesTable.id),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_workout_exercises_workout_id").on(table.workoutId)],
);

export const workoutSetsTable = sqliteTable(
  "workout_sets",
  {
    id: text("id").primaryKey(),
    workoutExerciseId: text("workout_exercise_id")
      .notNull()
      .references(() => workoutExercisesTable.id, { onDelete: "cascade" }),
    setIndex: integer("set_index").notNull(),
    type: text("type").$type<SetType>().notNull(),
    weight: real("weight"),
    reps: integer("reps"),
    rpe: real("rpe"),
    finishedAt: integer("finished_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_workout_sets_exercise_id").on(table.workoutExerciseId),
  ],
);

export type ExerciseRow = typeof exercisesTable.$inferSelect;
export type NewExerciseRow = typeof exercisesTable.$inferInsert;

export type WorkoutRow = typeof workoutsTable.$inferSelect;
export type NewWorkoutRow = typeof workoutsTable.$inferInsert;

export type WorkoutExerciseRow = typeof workoutExercisesTable.$inferSelect;
export type NewWorkoutExerciseRow = typeof workoutExercisesTable.$inferInsert;

export type WorkoutSetRow = typeof workoutSetsTable.$inferSelect;
export type NewWorkoutSetRow = typeof workoutSetsTable.$inferInsert;
