import { LiftFamily, SetType } from "../domain.types";
import { VariationId } from "../variations/variation.types";
import {
    assertWorkoutAggregateInvariants,
    assertWorkoutCanAddSection,
    assertWorkoutIsEditable,
} from "./workout.invariants";
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
  assertWorkoutIsEditable(workoutAggregate);
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
    type: "working" as SetType,
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
