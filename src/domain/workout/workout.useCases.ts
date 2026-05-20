import { LiftFamily, SetType } from "@/domain/domain.types";
import { VariationId } from "@/domain/variations/variation.types";

import {
    assertWorkoutCanAddSection,
    assertWorkoutIsActive,
    assertWorkoutSectionExists,
} from "./assertions/workout.contracts";
import { assertWorkoutAggregateInvariants } from "./assertions/workout.invariants";
import {
    WorkoutAggregate,
    WorkoutId,
    WorkoutSectionId,
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
  setType?: SetType;
  weight?: number | null;
  reps?: number | null;
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

  const firstSet = {
    id: input.setId,
    workoutSectionId: input.sectionId,
    setIndex: 0,
    type: input.initialSetType ?? "working",
    weight: null,
    reps: null,
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
  assertWorkoutSectionExists(workoutAggregate, input.sectionId);

  const updatedSections = workoutAggregate.sections.map(
    (workoutSectionAggregate) => {
      if (workoutSectionAggregate.section.id !== input.sectionId)
        return workoutSectionAggregate;

      const newSet = {
        id: input.setId,
        workoutSectionId: input.sectionId,
        setIndex: workoutSectionAggregate.sets.length,
        type: input.setType ?? "working",
        weight: input.weight ?? null,
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
