import {
  getActiveWorkoutExercise,
  getActiveWorkoutSet,
  getActiveWorkoutSetIndex,
  getAllWorkoutSets,
} from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutSet,
} from "@/domain/workout/workout.types";

export type ActiveWorkoutTemplateCardViewModel =
  | {
      status: "configure";
      workoutName: string;
      exerciseName: null;
      activeSetPosition: 0;
      totalSets: number;
    }
  | {
      status: "nextSet";
      workoutName: string;
      exerciseName: string;
      activeSetPosition: number;
      totalSets: number;
      nextSet: Pick<WorkoutSet, "weight" | "reps" | "rpe">;
    }
  | {
      status: "complete";
      workoutName: string;
      exerciseName: string;
      activeSetPosition: number;
      totalSets: number;
    };

function getWorkoutDisplayName(workoutAggregate: WorkoutAggregate): string {
  return workoutAggregate.workout.sourceTemplateId === null
    ? "Quick Workout"
    : "Template Workout";
}

export function getActiveWorkoutFooterContent(
  viewModel: ActiveWorkoutTemplateCardViewModel,
): {
  label: string;
  value: string;
} {
  switch (viewModel.status) {
    case "configure":
      return {
        label: "Next Set",
        value: "Configure First Set",
      };

    case "complete":
      return {
        label: "Status",
        value: "All Sets Complete",
      };

    case "nextSet": {
      const weight = viewModel.nextSet.weight ?? "—";
      const reps = viewModel.nextSet.reps ?? "—";
      const rpe =
        viewModel.nextSet.rpe === null ? "" : ` · RPE ${viewModel.nextSet.rpe}`;

      return {
        label: "Next Set",
        value: `${weight} KG × ${reps}${rpe}`,
      };
    }
  }
}

export function createActiveWorkoutTemplateCardViewModel(
  workoutAggregate: WorkoutAggregate,
): ActiveWorkoutTemplateCardViewModel {
  const workoutName = getWorkoutDisplayName(workoutAggregate);
  const allSets = getAllWorkoutSets(workoutAggregate);
  const activeSet = getActiveWorkoutSet(workoutAggregate);
  const activeExercise = getActiveWorkoutExercise(workoutAggregate);
  const activeSetIndex = getActiveWorkoutSetIndex(workoutAggregate);

  if (!activeSet || !activeExercise || activeSetIndex === undefined) {
    return {
      status: "configure",
      workoutName,
      exerciseName: null,
      activeSetPosition: 0,
      totalSets: allSets.length,
    };
  }

  const commonViewModel = {
    workoutName,
    exerciseName: activeExercise.exercise.name,
    activeSetPosition: activeSetIndex + 1,
    totalSets: allSets.length,
  };
  const allSetsComplete = allSets.every((set) => set.finishedAt !== null);

  if (allSetsComplete) {
    return {
      status: "complete",
      ...commonViewModel,
    };
  }

  return {
    status: "nextSet",
    ...commonViewModel,
    nextSet: {
      weight: activeSet.weight,
      reps: activeSet.reps,
      rpe: activeSet.rpe,
    },
  };
}
