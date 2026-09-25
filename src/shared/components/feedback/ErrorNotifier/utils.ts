import {
  CreateTemplateOperations,
  EditTemplateOperations,
} from "@/features/templates/editor/session/templatesSession.types";
import {
  ActiveWorkoutOperation,
  StartWorkoutOperation,
} from "@/features/workout/session/workoutSession.types";

export function getActiveWorkoutOperationErrorMessage(
  operation: ActiveWorkoutOperation | StartWorkoutOperation,
): string {
  if (typeof operation === "string") {
    switch (operation) {
      case "startEmptyWorkout":
        return "Couldn't start workout. Try again.";
      case "startWorkoutFromTemplate":
        return "Couldn't start workout from template. Try again.";
    }
  }

  switch (operation.type) {
    case "repeatWorkout":
      return "Couldn't repeat workout. Try again.";

    case "addExercise":
      return "Couldn't add exercise. Try again.";

    case "removeExercise":
      return "Couldn't remove exercise. Try again.";

    case "updateExerciseOrder":
      return "Couldn't update exercise order. Try again.";

    case "removeSet":
      return "Couldn't remove set. Try again.";

    case "addSet":
      return "Couldn't add set. Try again.";

    case "copyPreviousSet":
      return "Couldn't copy previous set. Try again.";

    case "updateSet":
      return "Couldn't update set. Try again.";

    case "completeSet":
      return "Couldn't complete set. Try again.";

    case "adjustRestTimer":
      return "Couldn't adjust rest timer. Try again.";

    case "resetRestTimer":
      return "Couldn't reset rest timer. Try again.";

    case "skipRestTimer":
      return "Couldn't skip rest timer. Try again.";

    case "undoCompletedSet":
      return "Couldn't undo set completion. Try again.";

    case "selectSet":
      return "Couldn't select set. Try again.";

    case "cancelWorkout":
      return "Couldn't cancel workout. Try again.";

    case "finishWorkout":
      return "Couldn't finish workout. Try again.";
  }
}

export function getTemplateEditorOperationErrorMessage(
  operation: CreateTemplateOperations | EditTemplateOperations,
): string {
  switch (operation.type) {
    case "createEmptyTemplate":
    case "createTemplate":
      return "Couldn't create template. Try again.";

    case "editTemplate":
      return "Couldn't edit template. Try again.";

    case "discardTemplate":
      return "Couldn't discard template. Try again.";

    case "updateMetadata":
      return "Couldn't update template details. Try again.";

    case "addExercise":
      return "Couldn't add exercise. Try again.";

    case "removeExercise":
      return "Couldn't remove exercise. Try again.";

    case "removeSet":
      return "Couldn't remove set. Try again.";

    case "updateSet":
      return "Couldn't update set. Try again.";
  }
}
