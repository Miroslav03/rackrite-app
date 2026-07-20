import type { SetType } from "@/domain/domain.types";
import type { Exercise } from "@/domain/exercises/exercise.types";

import {
  assertWorkoutExerciseExists,
  assertWorkoutIsActive,
  assertWorkoutSetExists,
} from "./assertions/workout.contracts";
import { assertWorkoutAggregateInvariants } from "./assertions/workout.invariants";

import {
  getAllWorkoutSets,
  getWorkoutExerciseById,
  getWorkoutSetById,
} from "./workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutId,
  WorkoutSet,
  WorkoutSetId,
} from "./workout.types";

type CreateEmptyWorkoutInput = {
  id: WorkoutId;
  now: number;
};

type AddWorkoutExerciseInput = {
  workoutExerciseId: WorkoutExerciseId;
  setId: WorkoutSetId;
  exercise: Exercise;
  now: number;
};

type AddWorkoutSetInput = {
  workoutExerciseId: WorkoutExerciseId;
  setId: WorkoutSetId;
  now: number;
  type?: SetType;
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
};

type UpdateWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
  type?: SetType;
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
};

type CompleteWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
};

type SelectWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
};

type FinishWorkoutInput = {
  now: number;
};

export function createEmptyWorkout({
  id,
  now,
}: CreateEmptyWorkoutInput): WorkoutAggregate {
  const workoutAggregate: WorkoutAggregate = {
    workout: {
      id,
      sourceTemplateId: null,
      status: "active",
      activeSetId: null,
      startedAt: now,
      finishedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    exercises: [],
  };

  assertWorkoutAggregateInvariants(workoutAggregate);

  return workoutAggregate;
}

export function addWorkoutExercise(
  workoutAggregate: WorkoutAggregate,
  input: AddWorkoutExerciseInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const workoutExercise = {
    id: input.workoutExerciseId,
    workoutId: workoutAggregate.workout.id,
    exerciseId: input.exercise.id,
    notes: null,
    orderIndex: workoutAggregate.exercises.length,
    createdAt: input.now,
    updatedAt: input.now,
  };
  const initialSet: WorkoutSet = {
    id: input.setId,
    workoutExerciseId: input.workoutExerciseId,
    setIndex: 0,
    type: "working",
    weight: null,
    reps: null,
    rpe: null,
    finishedAt: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: input.setId,
      updatedAt: input.now,
    },
    exercises: [
      ...workoutAggregate.exercises,
      {
        workoutExercise,
        exercise: input.exercise,
        sets: [initialSet],
      },
    ],
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function addWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: AddWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);
  assertWorkoutExerciseExists(
    getWorkoutExerciseById(workoutAggregate, input.workoutExerciseId),
  );

  const exercises = workoutAggregate.exercises.map((exerciseAggregate) => {
    if (exerciseAggregate.workoutExercise.id !== input.workoutExerciseId) {
      return exerciseAggregate;
    }

    const newSet: WorkoutSet = {
      id: input.setId,
      workoutExerciseId: input.workoutExerciseId,
      setIndex: exerciseAggregate.sets.length,
      type: input.type ?? "working",
      weight: input.weight ?? null,
      reps: input.reps ?? null,
      rpe: input.rpe ?? null,
      finishedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    };

    return {
      ...exerciseAggregate,
      workoutExercise: {
        ...exerciseAggregate.workoutExercise,
        updatedAt: input.now,
      },
      sets: [...exerciseAggregate.sets, newSet],
    };
  });
  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: input.setId,
      updatedAt: input.now,
    },
    exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function updateWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: UpdateWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);
  assertWorkoutSetExists(getWorkoutSetById(workoutAggregate, input.setId));

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises.map((exerciseAggregate) => ({
      ...exerciseAggregate,
      sets: exerciseAggregate.sets.map((set) =>
        set.id === input.setId
          ? {
              ...set,
              type: input.type ?? set.type,
              weight: input.weight !== undefined ? input.weight : set.weight,
              reps: input.reps !== undefined ? input.reps : set.reps,
              rpe: input.rpe !== undefined ? input.rpe : set.rpe,
              updatedAt: input.now,
            }
          : set,
      ),
    })),
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function selectWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: SelectWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);
  assertWorkoutSetExists(getWorkoutSetById(workoutAggregate, input.setId));

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: input.setId,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function completeWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: CompleteWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const targetSet = getWorkoutSetById(workoutAggregate, input.setId);
  assertWorkoutSetExists(targetSet);

  if (targetSet.weight === null) {
    throw new Error("Set must have weight before it can be completed");
  }

  if (targetSet.reps === null) {
    throw new Error("Set must have reps before it can be completed");
  }

  const exercises = workoutAggregate.exercises.map((exerciseAggregate) => ({
    ...exerciseAggregate,
    sets: exerciseAggregate.sets.map((set) =>
      set.id === input.setId
        ? { ...set, finishedAt: input.now, updatedAt: input.now }
        : set,
    ),
  }));
  const workoutAfterSetUpdate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      updatedAt: input.now,
    },
    exercises,
  };
  const allSets = getAllWorkoutSets(workoutAfterSetUpdate);
  const completedSetIndex = allSets.findIndex((set) => set.id === input.setId);
  const nextUnfinishedSet = allSets
    .slice(completedSetIndex + 1)
    .find((set) => set.finishedAt === null);
  const previousUnfinishedSet = allSets
    .slice(0, completedSetIndex)
    .find((set) => set.finishedAt === null);
  const lastSet = allSets[allSets.length - 1];
  const nextWorkoutAggregate: WorkoutAggregate = {
    ...workoutAfterSetUpdate,
    workout: {
      ...workoutAfterSetUpdate.workout,
      activeSetId:
        nextUnfinishedSet?.id ?? previousUnfinishedSet?.id ?? lastSet.id,
    },
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function finishWorkout(
  workoutAggregate: WorkoutAggregate,
  input: FinishWorkoutInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const hasCompletedSet = getAllWorkoutSets(workoutAggregate).some(
    (set) => set.finishedAt !== null,
  );

  if (!hasCompletedSet) {
    throw new Error("Workout must have at least one completed set");
  }

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      status: "completed",
      finishedAt: input.now,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}
