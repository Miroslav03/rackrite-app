import type {
  TemplateAggregate,
  TemplateExerciseAggregate,
  TemplateSet,
} from "../templates.types";

import { assertTemplateAggregateInvariants } from "./templates.invariants";

export function assertTemplateExerciseExists(
  exercise: TemplateExerciseAggregate | undefined,
): asserts exercise is TemplateExerciseAggregate {
  if (!exercise) throw new Error("Template exercise not found");
}

export function assertTemplateSetExists(
  set: TemplateSet | undefined,
): asserts set is TemplateSet {
  if (!set) throw new Error("Template set not found");
}

export function assertTemplateOrderIndexIsValid(
  index: number,
  length: number,
): void {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error("Template order index is invalid");
  }
}

export function assertTemplateCanBeSaved(aggregate: TemplateAggregate): void {
  assertTemplateAggregateInvariants(aggregate);

  if (aggregate.template.name.trim().length === 0) {
    throw new Error("Template must have a name");
  }

  if (aggregate.exercises.length === 0) {
    throw new Error("Template must have at least one exercise");
  }
}
