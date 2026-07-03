import {
    index,
    integer,
    real,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

import type { LiftFamily, SetType } from "@/domain/domain.types";
import type { WorkoutStatus } from "@/domain/workout/workout.types";

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

export const workoutSectionsTable = sqliteTable(
  "workout_sections",
  {
    id: text("id").primaryKey(),

    workoutId: text("workout_id")
      .notNull()
      .references(() => workoutsTable.id, { onDelete: "cascade" }),

    variationId: text("variation_id").notNull(),

    liftFamily: text("lift_family").$type<LiftFamily>().notNull(),

    notes: text("notes"),

    orderIndex: integer("order_index").notNull(),

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_workout_sections_workout_id").on(table.workoutId)],
);

export const workoutSetsTable = sqliteTable(
  "workout_sets",
  {
    id: text("id").primaryKey(),

    workoutSectionId: text("workout_section_id")
      .notNull()
      .references(() => workoutSectionsTable.id, { onDelete: "cascade" }),

    setIndex: integer("set_index").notNull(),

    type: text("type").$type<SetType>().notNull(),

    weight: real("weight"),
    reps: integer("reps"),
    rpe: real("rpe"),

    finishedAt: integer("finished_at"),

    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_workout_sets_section_id").on(table.workoutSectionId)],
);

export type WorkoutRow = typeof workoutsTable.$inferSelect;
export type NewWorkoutRow = typeof workoutsTable.$inferInsert;

export type WorkoutSectionRow = typeof workoutSectionsTable.$inferSelect;
export type NewWorkoutSectionRow = typeof workoutSectionsTable.$inferInsert;

export type WorkoutSetRow = typeof workoutSetsTable.$inferSelect;
export type NewWorkoutSetRow = typeof workoutSetsTable.$inferInsert;
