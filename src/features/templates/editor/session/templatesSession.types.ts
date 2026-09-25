import { ExerciseId } from "@/domain/exercises/exercise.types";
import {
  TemplateAggregate,
  TemplateExerciseId,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { OperationState } from "@/shared/state/operationState";

export type CommonTemplateOperations =
  | {
      type: "updateMetadata";
    }
  | {
      type: "addExercise";
      exerciseId: ExerciseId;
    }
  | {
      type: "removeExercise";
      templateExerciseId: TemplateExerciseId;
    }
  | {
      type: "discardTemplate";
    };

export type CreateTemplateOperations =
  | CommonTemplateOperations
  | {
      type: "createEmptyTemplate";
    }
  | {
      type: "createTemplate";
    };

export type EditTemplateOperations =
  | CommonTemplateOperations
  | {
      type: "editTemplate";
    };

export type TemplateSessionState =
  | { status: "noActiveTemplate" }
  | { status: "loading" }
  | {
      status: "loadError";
      error: Error;
    }
  | {
      status: "edit";
      activeSetId: TemplateSetId | null;
      originalTemplate: TemplateAggregate;
      activeTemplate: TemplateAggregate;
      operation: OperationState<EditTemplateOperations>;
    }
  | {
      status: "create";
      activeSetId: TemplateSetId | null;
      activeTemplate: TemplateAggregate;
      operation: OperationState<CreateTemplateOperations>;
    };

export type TemplateSessionEvent =
  | { type: "creationStarted" }
  | { type: "editingStarted" }
  | {
      type: "creationFailed";
      error: Error;
    }
  | {
      type: "editingFailed";
      error: Error;
    }
  | {
      type: "creationSucceeded";
      template: TemplateAggregate;
    }
  | {
      type: "editingSucceeded";
      template: TemplateAggregate;
    }
  | {
      type: "createOperationStarted";
      operation: CreateTemplateOperations;
    }
  | {
      type: "editOperationStarted";
      operation: EditTemplateOperations;
    }
  | {
      type: "createOperationFailed";
      operation: CreateTemplateOperations;
      error: Error;
    }
  | {
      type: "editOperationFailed";
      operation: EditTemplateOperations;
      error: Error;
    }
  | {
      type: "operationErrorDismissed";
      error: Error;
    }
  | {
      type: "templateCommitted";
      template: TemplateAggregate;
    }
  | { type: "templateCleared" };
