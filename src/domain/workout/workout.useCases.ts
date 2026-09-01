import type { Exercise } from "@/domain/exercises/exercise.types";

import {
  assertWorkoutExerciseExists,
  assertWorkoutIsActive,
  assertWorkoutSetExists,
} from "./assertions/workout.contracts";
import { assertWorkoutAggregateInvariants } from "./assertions/workout.invariants";

import {
  getActiveSetIdAfterRemoval,
  getAllWorkoutSets,
  getNextActiveWorkoutSetIdAfter,
  getNextUnfinishedWorkoutSetAfter,
  getRestTimerAfterRemoval,
  getWorkoutExerciseById,
  getWorkoutExerciseBySetId,
  getWorkoutSetById,
  isWorkoutRestTimerExpired,
} from "./workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutExerciseId,
  WorkoutId,
  WorkoutSet,
  WorkoutSetId,
  WorkoutSetValues,
} from "./workout.types";

type CreateEmptyWorkoutInput = {
  id: WorkoutId;
  now: number;
};

type AddWorkoutExerciseInput = {
  workoutExerciseId: WorkoutExerciseId;
  setId: WorkoutSetId;
  exercise: Exercise;
  restSeconds: number;
  now: number;
};

type RemoveWorkoutExerciseInput = {
  workoutExerciseId: WorkoutExerciseId;
  now: number;
};

type UpdateWorkoutExerciseRestSecondsInput = {
  workoutExerciseId: WorkoutExerciseId;
  restSeconds: number;
  now: number;
};

type AddWorkoutSetInput = {
  workoutExerciseId: WorkoutExerciseId;
  setId: WorkoutSetId;
  now: number;
} & Partial<WorkoutSetValues>;

type RemoveWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
};

type UpdateWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
} & Partial<WorkoutSetValues>;

type CompleteWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
};

type UndoWorkoutSetCompletionInput = {
  setId: WorkoutSetId;
  now: number;
};

type StartWorkoutRestTimerInput = {
  setId: WorkoutSetId;
  now: number;
};

type ClearWorkoutRestTimerInput = {
  now: number;
};

type AdjustWorkoutRestTimerInput = {
  seconds: number;
  now: number;
};

type ResetWorkoutRestTimerInput = {
  now: number;
};

type SkipWorkoutRestTimerInput = {
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
      restTimer: null,
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
    restSeconds: input.restSeconds,
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

export function removeWorkoutExercise(
  workoutAggregate: WorkoutAggregate,
  input: RemoveWorkoutExerciseInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const exerciseToRemove = getWorkoutExerciseById(
    workoutAggregate,
    input.workoutExerciseId,
  );

  assertWorkoutExerciseExists(exerciseToRemove);

  const remainingExercises = workoutAggregate.exercises
    .filter(
      ({ workoutExercise }) => workoutExercise.id !== input.workoutExerciseId,
    )
    .map((exerciseAggregate, orderIndex) =>
      exerciseAggregate.workoutExercise.orderIndex === orderIndex
        ? exerciseAggregate
        : {
            ...exerciseAggregate,
            workoutExercise: {
              ...exerciseAggregate.workoutExercise,
              orderIndex,
              updatedAt: input.now,
            },
          },
    );

  const remainingSets = remainingExercises.flatMap(({ sets }) => sets);
  const removedSetIds = new Set(exerciseToRemove.sets.map(({ id }) => id));

  const nextActiveSetId = getActiveSetIdAfterRemoval(
    workoutAggregate,
    removedSetIds,
  );

  const nextRestTimer = getRestTimerAfterRemoval(
    workoutAggregate,
    remainingSets,
    removedSetIds,
  );

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: nextActiveSetId,
      restTimer: nextRestTimer,
      updatedAt: input.now,
    },
    exercises: remainingExercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function updateWorkoutExerciseRestSeconds(
  workoutAggregate: WorkoutAggregate,
  input: UpdateWorkoutExerciseRestSecondsInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);
  assertWorkoutExerciseExists(
    getWorkoutExerciseById(workoutAggregate, input.workoutExerciseId),
  );

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises.map((exerciseAggregate) =>
      exerciseAggregate.workoutExercise.id === input.workoutExerciseId
        ? {
            ...exerciseAggregate,
            workoutExercise: {
              ...exerciseAggregate.workoutExercise,
              restSeconds: input.restSeconds,
              updatedAt: input.now,
            },
          }
        : exerciseAggregate,
    ),
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

export function removeWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: RemoveWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);
  assertWorkoutSetExists(getWorkoutSetById(workoutAggregate, input.setId));

  const targetExercise = getWorkoutExerciseBySetId(
    workoutAggregate,
    input.setId,
  );
  assertWorkoutExerciseExists(targetExercise);

  const remainingExerciseSets = targetExercise.sets
    .filter((set) => set.id !== input.setId)
    .map((set, setIndex) =>
      set.setIndex === setIndex
        ? set
        : {
            ...set,
            setIndex,
            updatedAt: input.now,
          },
    );

  if (remainingExerciseSets.length === 0) {
    return removeWorkoutExercise(workoutAggregate, {
      workoutExerciseId: targetExercise.workoutExercise.id,
      now: input.now,
    });
  }

  const remainingExercises = workoutAggregate.exercises.map(
    (exerciseAggregate) => {
      if (
        exerciseAggregate.workoutExercise.id !==
        targetExercise.workoutExercise.id
      ) {
        return exerciseAggregate;
      }

      return {
        ...exerciseAggregate,
        workoutExercise: {
          ...exerciseAggregate.workoutExercise,
          updatedAt: input.now,
        },
        sets: remainingExerciseSets,
      };
    },
  );

  const remainingSets = remainingExercises.flatMap(({ sets }) => sets);
  const removedSetIds = new Set<WorkoutSetId>([input.setId]);
  const nextActiveSetId = getActiveSetIdAfterRemoval(
    workoutAggregate,
    removedSetIds,
  );

  const nextRestTimer = getRestTimerAfterRemoval(
    workoutAggregate,
    remainingSets,
    removedSetIds,
  );

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: nextActiveSetId,
      restTimer: nextRestTimer,
      updatedAt: input.now,
    },
    exercises: remainingExercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function updateWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: UpdateWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const targetSet = getWorkoutSetById(workoutAggregate, input.setId);
  assertWorkoutSetExists(targetSet);

  const shouldAutomaticallyUndo =
    targetSet.finishedAt !== null &&
    (input.weight === null || input.reps === null);
  const editableWorkoutAggregate = shouldAutomaticallyUndo
    ? undoWorkoutSetCompletion(workoutAggregate, {
        setId: input.setId,
        now: input.now,
      })
    : workoutAggregate;

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...editableWorkoutAggregate.workout,
      updatedAt: input.now,
    },
    exercises: editableWorkoutAggregate.exercises.map((exerciseAggregate) => {
      const containsTargetSet = exerciseAggregate.sets.some(
        (set) => set.id === input.setId,
      );

      if (!containsTargetSet) {
        return exerciseAggregate;
      }

      return {
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
      };
    }),
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function undoWorkoutSetCompletion(
  workoutAggregate: WorkoutAggregate,
  input: UndoWorkoutSetCompletionInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const targetSet = getWorkoutSetById(workoutAggregate, input.setId);
  assertWorkoutSetExists(targetSet);

  if (targetSet.finishedAt === null) {
    throw new Error("Set must be completed before it can be undone");
  }

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: input.setId,
      restTimer: null,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises.map((exerciseAggregate) => {
      if (!exerciseAggregate.sets.some((set) => set.id === input.setId)) {
        return exerciseAggregate;
      }

      return {
        ...exerciseAggregate,
        sets: exerciseAggregate.sets.map((set) =>
          set.id === input.setId
            ? {
                ...set,
                finishedAt: null,
                updatedAt: input.now,
              }
            : set,
        ),
      };
    }),
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

  const exercises = workoutAggregate.exercises.map((exerciseAggregate) => {
    if (exerciseAggregate.workoutExercise.id !== targetSet.workoutExerciseId) {
      return exerciseAggregate;
    }

    return {
      ...exerciseAggregate,
      sets: exerciseAggregate.sets.map((set) =>
        set.id === input.setId
          ? {
              ...set,
              finishedAt: input.now,
              updatedAt: input.now,
            }
          : set,
      ),
    };
  });

  const workoutAfterSetUpdate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      restTimer: null,
      updatedAt: input.now,
    },
    exercises,
  };

  const nextActiveSetId = getNextActiveWorkoutSetIdAfter(
    workoutAfterSetUpdate,
    input.setId,
  );

  const nextWorkoutAggregate: WorkoutAggregate = {
    ...workoutAfterSetUpdate,
    workout: {
      ...workoutAfterSetUpdate.workout,
      activeSetId: nextActiveSetId,
    },
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function startWorkoutRestTimer(
  workoutAggregate: WorkoutAggregate,
  input: StartWorkoutRestTimerInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const sourceSet = getWorkoutSetById(workoutAggregate, input.setId);

  assertWorkoutSetExists(sourceSet);

  if (sourceSet.finishedAt === null) {
    throw new Error("Rest timer can only start after a completed set");
  }

  const sourceExercise = getWorkoutExerciseBySetId(
    workoutAggregate,
    input.setId,
  );

  assertWorkoutExerciseExists(sourceExercise);

  if (
    !getAllWorkoutSets(workoutAggregate).some((set) => set.finishedAt === null)
  ) {
    throw new Error("Rest timer requires an unfinished set");
  }

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      restTimer: {
        sourceSetId: input.setId,
        startedAt: input.now,
        endsAt: input.now + sourceExercise.workoutExercise.restSeconds * 1_000,
      },
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function clearWorkoutRestTimer(
  workoutAggregate: WorkoutAggregate,
  input: ClearWorkoutRestTimerInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  if (workoutAggregate.workout.restTimer === null) {
    return workoutAggregate;
  }

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      restTimer: null,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function adjustWorkoutRestTimer(
  workoutAggregate: WorkoutAggregate,
  input: AdjustWorkoutRestTimerInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const timer = workoutAggregate.workout.restTimer;

  if (timer === null) {
    return workoutAggregate;
  }

  if (!Number.isInteger(input.seconds) || input.seconds === 0) {
    throw new Error("Rest timer adjustment must be a non-zero whole number");
  }

  if (isWorkoutRestTimerExpired(timer, input.now)) {
    return skipWorkoutRestTimer(workoutAggregate, { now: input.now });
  }

  const adjustedEndsAt = timer.endsAt + input.seconds * 1_000;

  if (adjustedEndsAt <= input.now) {
    return skipWorkoutRestTimer(workoutAggregate, { now: input.now });
  }

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      restTimer: {
        ...timer,
        endsAt: adjustedEndsAt,
      },
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function resetWorkoutRestTimer(
  workoutAggregate: WorkoutAggregate,
  input: ResetWorkoutRestTimerInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const timer = workoutAggregate.workout.restTimer;

  if (timer === null) {
    return workoutAggregate;
  }

  if (isWorkoutRestTimerExpired(timer, input.now)) {
    return skipWorkoutRestTimer(workoutAggregate, { now: input.now });
  }

  const sourceExercise = getWorkoutExerciseBySetId(
    workoutAggregate,
    timer.sourceSetId,
  );

  assertWorkoutExerciseExists(sourceExercise);

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      restTimer: {
        sourceSetId: timer.sourceSetId,
        startedAt: input.now,
        endsAt: input.now + sourceExercise.workoutExercise.restSeconds * 1_000,
      },
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function skipWorkoutRestTimer(
  workoutAggregate: WorkoutAggregate,
  input: SkipWorkoutRestTimerInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const timer = workoutAggregate.workout.restTimer;

  if (timer === null) {
    return workoutAggregate;
  }

  const nextUnfinishedSet = getNextUnfinishedWorkoutSetAfter(
    workoutAggregate,
    timer.sourceSetId,
  );

  if (!nextUnfinishedSet) {
    throw new Error("Rest timer requires an unfinished set");
  }

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: nextUnfinishedSet.id,
      restTimer: null,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
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
      restTimer: null,
      finishedAt: input.now,
      updatedAt: input.now,
    },
    exercises: workoutAggregate.exercises,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}
