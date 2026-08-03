CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`origin` text NOT NULL,
	`lift_family` text,
	`default_rest_seconds` integer
);
--> statement-breakpoint
CREATE TABLE `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`notes` text,
	`rest_seconds` integer NOT NULL,
	`order_index` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workout_exercises_workout_id` ON `workout_exercises` (`workout_id`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_exercise_id` text NOT NULL,
	`set_index` integer NOT NULL,
	`type` text NOT NULL,
	`weight` real,
	`reps` integer,
	`rpe` real,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workout_exercise_id`) REFERENCES `workout_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workout_sets_exercise_id` ON `workout_sets` (`workout_exercise_id`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`source_template_id` text,
	`status` text NOT NULL,
	`active_set_id` text,
	`rest_timer_started_at` integer,
	`rest_timer_ends_at` integer,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "workouts_rest_timer_is_valid" CHECK(
        (
          "workouts"."rest_timer_started_at" IS NULL
          AND "workouts"."rest_timer_ends_at" IS NULL
        )
        OR
        (
          "workouts"."status" = 'active'
          AND "workouts"."rest_timer_started_at" IS NOT NULL
          AND "workouts"."rest_timer_ends_at" IS NOT NULL
          AND "workouts"."rest_timer_ends_at" > "workouts"."rest_timer_started_at"
        )
      )
);
