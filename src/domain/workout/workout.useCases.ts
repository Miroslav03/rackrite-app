import { LiftFamily, SetType } from "@/domain/domain.types";
import { VariationId } from "@/domain/variations/variation.types";

import {
  assertWorkoutCanAddSection,
  assertWorkoutIsActive,
  assertWorkoutSectionExists,
  assertWorkoutSetExists,
} from "./assertions/workout.contracts";
import { assertWorkoutAggregateInvariants } from "./assertions/workout.invariants";

import {
  getAllWorkoutSets,
  getWorkoutSectionById,
  getWorkoutSetById,
} from "./workout.selectors";
import {
  WorkoutAggregate,
  WorkoutId,
  WorkoutSectionId,
  WorkoutSet,
  WorkoutSetId,
} from "./workout.types";

type CreateEmptyWorkoutInput = {
  id: WorkoutId;
  now: number;
};

type AddWorkoutSectionInput = {
  sectionId: WorkoutSectionId;
  setId: WorkoutSetId;
  liftFamily: LiftFamily;
  variationId: VariationId;
  now: number;
  initialSetType?: SetType;
};

type AddWorkoutSetInput = {
  sectionId: WorkoutSectionId;
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

type FinishWorkoutInput = {
  now: number;
};

type SelectWorkoutSetInput = {
  setId: WorkoutSetId;
  now: number;
};

export function createEmptyWorkout({
  id,
  now,
}: CreateEmptyWorkoutInput): WorkoutAggregate {
  const aggregate: WorkoutAggregate = {
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
    sections: [],
  };

  assertWorkoutAggregateInvariants(aggregate);

  return aggregate;
}

export function finishWorkout(
  workoutAggregate: WorkoutAggregate,
  input: FinishWorkoutInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const allSets = getAllWorkoutSets(workoutAggregate);

  const hasCompletedSet = allSets.some((set) => set.finishedAt !== null);

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
    sections: workoutAggregate.sections,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function addWorkoutSection(
  workoutAggregate: WorkoutAggregate,
  input: AddWorkoutSectionInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);
  assertWorkoutCanAddSection(workoutAggregate, input.liftFamily);

  const section = {
    id: input.sectionId,
    workoutId: workoutAggregate.workout.id,
    variationId: input.variationId,
    liftFamily: input.liftFamily,
    notes: null,
    orderIndex: workoutAggregate.sections.length,
    createdAt: input.now,
    updatedAt: input.now,
  };

  const firstSet: WorkoutSet = {
    id: input.setId,
    workoutSectionId: input.sectionId,
    setIndex: 0,
    type: input.initialSetType ?? "working",
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
    sections: [
      ...workoutAggregate.sections,
      {
        section,
        sets: [firstSet],
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
  assertWorkoutSectionExists(
    getWorkoutSectionById(workoutAggregate, input.sectionId),
  );

  const updatedSections = workoutAggregate.sections.map(
    (workoutSectionAggregate) => {
      if (workoutSectionAggregate.section.id !== input.sectionId)
        return workoutSectionAggregate;

      const newSet = {
        id: input.setId,
        workoutSectionId: input.sectionId,
        setIndex: workoutSectionAggregate.sets.length,
        type: input.type ?? "working",
        weight: input.weight ?? null,
        rpe: input.rpe ?? null,
        reps: input.reps ?? null,
        finishedAt: null,
        createdAt: input.now,
        updatedAt: input.now,
      };

      return {
        section: {
          ...workoutSectionAggregate.section,
          updatedAt: input.now,
        },
        sets: [...workoutSectionAggregate.sets, newSet],
      };
    },
  );

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: input.setId,
      updatedAt: input.now,
    },
    sections: updatedSections,
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

  if (input.weight !== undefined && input.weight !== null && input.weight < 0) {
    throw new Error("Weight cannot be a negative number");
  }

  if (input.reps !== undefined && input.reps !== null) {
    if (!Number.isInteger(input.reps)) {
      throw new Error("Reps must be a whole number");
    }

    if (input.reps <= 0) {
      throw new Error("Reps must be a positive number");
    }
  }

  if (input.rpe !== undefined && input.rpe !== null) {
    if (input.rpe < 1 || input.rpe > 10) {
      throw new Error("RPE must be between 1 and 10");
    }
  }

  const updatedSections = workoutAggregate.sections.map((sectionAggregate) => {
    const updatedSets = sectionAggregate.sets.map((setAggregate) => {
      if (setAggregate.id !== input.setId) return setAggregate;

      return {
        ...setAggregate,
        type: input.type ?? setAggregate.type,
        reps: input.reps !== undefined ? input.reps : setAggregate.reps,
        weight: input.weight !== undefined ? input.weight : setAggregate.weight,
        rpe: input.rpe !== undefined ? input.rpe : setAggregate.rpe,
        updatedAt: input.now,
      };
    });

    return {
      ...sectionAggregate,
      sets: updatedSets,
    };
  });

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      updatedAt: input.now,
    },
    sections: updatedSections,
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

  const updatedSections = workoutAggregate.sections.map((sectionAggregate) => {
    const updatedSets = sectionAggregate.sets.map((setAggregate) => {
      if (setAggregate.id !== input.setId) return setAggregate;

      return {
        ...setAggregate,
        finishedAt: input.now,
        updatedAt: input.now,
      };
    });

    return {
      ...sectionAggregate,
      sets: updatedSets,
    };
  });

  const workoutAggregateAfterSetUpdate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      updatedAt: input.now,
    },
    sections: updatedSections,
  };

  const allSetsAfterUpdate = getAllWorkoutSets(workoutAggregateAfterSetUpdate);

  const completedSetIndex = allSetsAfterUpdate.findIndex(
    (set) => set.id === input.setId,
  );

  const nextUnfinishedSet = allSetsAfterUpdate
    .slice(completedSetIndex + 1)
    .find((set) => set.finishedAt === null);

  const previousUnfinishedSet = allSetsAfterUpdate
    .slice(0, completedSetIndex)
    .find((set) => set.finishedAt === null);

  const lastSet = allSetsAfterUpdate[allSetsAfterUpdate.length - 1];

  const nextActiveSetId =
    nextUnfinishedSet?.id ?? previousUnfinishedSet?.id ?? lastSet.id;

  const nextWorkoutAggregate: WorkoutAggregate = {
    ...workoutAggregateAfterSetUpdate,
    workout: {
      ...workoutAggregateAfterSetUpdate.workout,
      activeSetId: nextActiveSetId,
    },
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}

export function selectWorkoutSet(
  workoutAggregate: WorkoutAggregate,
  input: SelectWorkoutSetInput,
): WorkoutAggregate {
  assertWorkoutIsActive(workoutAggregate);

  const selectedSet = getWorkoutSetById(workoutAggregate, input.setId);

  assertWorkoutSetExists(selectedSet);

  const nextWorkoutAggregate: WorkoutAggregate = {
    workout: {
      ...workoutAggregate.workout,
      activeSetId: input.setId,
      updatedAt: input.now,
    },
    sections: workoutAggregate.sections,
  };

  assertWorkoutAggregateInvariants(nextWorkoutAggregate);

  return nextWorkoutAggregate;
}
