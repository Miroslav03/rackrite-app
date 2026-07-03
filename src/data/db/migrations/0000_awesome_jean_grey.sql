CREATE TABLE `workout_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_id` text NOT NULL,
	`variation_id` text NOT NULL,
	`lift_family` text NOT NULL,
	`notes` text,
	`order_index` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workout_sections_workout_id` ON `workout_sections` (`workout_id`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`workout_section_id` text NOT NULL,
	`set_index` integer NOT NULL,
	`type` text NOT NULL,
	`weight` real,
	`reps` integer,
	`rpe` real,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workout_section_id`) REFERENCES `workout_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workout_sets_section_id` ON `workout_sets` (`workout_section_id`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`source_template_id` text,
	`status` text NOT NULL,
	`active_set_id` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
