import { sql } from "drizzle-orm";
import {
  check,
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
  defaultRestSeconds: integer("default_rest_seconds"),
});

export const templatesTable = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const templateExercisesTable = sqliteTable(
  "template_exercises",
  {
    id: text("id").primaryKey(),
    templateId: text("template_id")
      .notNull()
      .references(() => templatesTable.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercisesTable.id),
    notes: text("notes"),
    restSeconds: integer("rest_seconds").notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_template_exercises_template_id").on(table.templateId)],
);

export const templateSetsTable = sqliteTable(
  "template_sets",
  {
    id: text("id").primaryKey(),
    templateExerciseId: text("template_exercise_id")
      .notNull()
      .references(() => templateExercisesTable.id, { onDelete: "cascade" }),
    setIndex: integer("set_index").notNull(),
    type: text("type").$type<SetType>().notNull(),
    reps: integer("reps").notNull(),
    rpe: real("rpe"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_template_sets_exercise_id").on(table.templateExerciseId),
  ],
);

export const workoutsTable = sqliteTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    sourceTemplateId: text("source_template_id"),
    status: text("status").$type<WorkoutStatus>().notNull(),
    activeSetId: text("active_set_id"),
    restTimerSourceSetId: text("rest_timer_source_set_id"),
    restTimerStartedAt: integer("rest_timer_started_at"),
    restTimerEndsAt: integer("rest_timer_ends_at"),
    startedAt: integer("started_at").notNull(),
    finishedAt: integer("finished_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_workouts_history").on(table.status, table.finishedAt, table.id),
    check(
      "workouts_rest_timer_is_valid",
      sql`
        (
          ${table.restTimerSourceSetId} IS NULL
          AND
          ${table.restTimerStartedAt} IS NULL
          AND ${table.restTimerEndsAt} IS NULL
        )
        OR
        (
          ${table.status} = 'active'
          AND ${table.restTimerSourceSetId} IS NOT NULL
          AND ${table.restTimerStartedAt} IS NOT NULL
          AND ${table.restTimerEndsAt} IS NOT NULL
          AND ${table.restTimerEndsAt} > ${table.restTimerStartedAt}
        )
      `,
    ),
  ],
);

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
    restSeconds: integer("rest_seconds").notNull(),
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

export type TemplateRow = typeof templatesTable.$inferSelect;
export type NewTemplateRow = typeof templatesTable.$inferInsert;
export type TemplateExerciseRow = typeof templateExercisesTable.$inferSelect;
export type NewTemplateExerciseRow = typeof templateExercisesTable.$inferInsert;
export type TemplateSetRow = typeof templateSetsTable.$inferSelect;
export type NewTemplateSetRow = typeof templateSetsTable.$inferInsert;

export type WorkoutRow = typeof workoutsTable.$inferSelect;
export type NewWorkoutRow = typeof workoutsTable.$inferInsert;

export type WorkoutExerciseRow = typeof workoutExercisesTable.$inferSelect;
export type NewWorkoutExerciseRow = typeof workoutExercisesTable.$inferInsert;

export type WorkoutSetRow = typeof workoutSetsTable.$inferSelect;
export type NewWorkoutSetRow = typeof workoutSetsTable.$inferInsert;
