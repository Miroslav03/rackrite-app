import { useCallback, useReducer, useRef } from "react";

import { getTemplateExerciseBySetId } from "@/domain/templates/editor/templates.selectors";
import type {
  TemplateAggregate,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { failure, success, type Result } from "@/shared/types/result";
import { toError } from "@/shared/utils/error";

import type {
  AddTemplateExerciseCommand,
  RemoveTemplateSetCommand,
  TemplateSessionActions,
  UpdateTemplateSetCommand,
} from "../actions/templateSessionActions";

import { templatesSessionReducer } from "./templatesSession.reducer";
import type {
  CommonTemplateOperations,
  TemplateSessionEvent,
  TemplateSessionState,
} from "./templatesSession.types";

export type TemplateSessionController = {
  state: TemplateSessionState;
  createEmptyTemplate: () => void;
  discardTemplate: () => void;
  addExercise: (
    command: AddTemplateExerciseCommand,
  ) => Result<TemplateAggregate>;
  updateSet: (command: UpdateTemplateSetCommand) => Result<TemplateAggregate>;
  removeSet: (command: RemoveTemplateSetCommand) => Result<TemplateAggregate>;
  selectSet: (templateSetId: TemplateSetId | null) => Result<void>;
  dismissOperationError: (error: Error) => void;
};

export const initialTemplateSessionState: TemplateSessionState = {
  status: "noActiveTemplate",
};

export function useTemplateSessionController(
  actions: TemplateSessionActions,
): TemplateSessionController {
  const [state, dispatch] = useReducer(
    templatesSessionReducer,
    initialTemplateSessionState,
  );

  const stateRef = useRef(state);

  // Commands in one render must build on the previous command's committed draft.
  const send = useCallback((event: TemplateSessionEvent) => {
    stateRef.current = templatesSessionReducer(stateRef.current, event);
    dispatch(event);
  }, []);

  const createEmptyTemplate = useCallback(() => {
    send({ type: "creationStarted" });

    try {
      send({
        type: "creationSucceeded",
        template: actions.createEmptyTemplate(),
      });
    } catch (error) {
      send({ type: "creationFailed", error: toError(error) });
    }
  }, [actions, send]);

  const discardTemplate = useCallback(
    () => send({ type: "templateCleared" }),
    [send],
  );

  const dismissOperationError = useCallback(
    (error: Error) => send({ type: "operationErrorDismissed", error }),
    [send],
  );

  const mutateTemplate = useCallback(
    (
      operation: CommonTemplateOperations,
      run: (template: TemplateAggregate) => TemplateAggregate,
    ): Result<TemplateAggregate> => {
      const current = stateRef.current;

      if (current.status !== "create" && current.status !== "edit") {
        return failure(new Error("No active template"));
      }

      send({
        type:
          current.status === "create"
            ? "createOperationStarted"
            : "editOperationStarted",
        operation,
      });

      try {
        const template = run(current.activeTemplate);

        send({ type: "templateCommitted", template });

        return success(template);
      } catch (cause) {
        const error = toError(cause);

        send({
          type:
            current.status === "create"
              ? "createOperationFailed"
              : "editOperationFailed",
          operation,
          error,
        });
        return failure(error);
      }
    },
    [send],
  );

  const addExercise = useCallback(
    (command: AddTemplateExerciseCommand) =>
      mutateTemplate(
        { type: "addExercise", exerciseId: command.exercise.id },
        (template) => actions.addExercise(template, command),
      ),
    [actions, mutateTemplate],
  );

  const updateSet = useCallback(
    (command: UpdateTemplateSetCommand) =>
      mutateTemplate(
        { type: "updateSet", templateSetId: command.templateSetId },
        (template) => actions.updateSet(template, command),
      ),
    [actions, mutateTemplate],
  );

  const removeSet = useCallback(
    (command: RemoveTemplateSetCommand) =>
      mutateTemplate(
        { type: "removeSet", templateSetId: command.templateSetId },
        (template) => actions.removeSet(template, command),
      ),
    [actions, mutateTemplate],
  );

  const selectSet = useCallback(
    (templateSetId: TemplateSetId | null): Result<void> => {
      const current = stateRef.current;

      if (current.status !== "create" && current.status !== "edit")
        return failure(new Error("No active template"));

      if (
        templateSetId !== null &&
        !getTemplateExerciseBySetId(current.activeTemplate, templateSetId)
      ) {
        return failure(new Error("Template set not found"));
      }

      send({ type: "setSelected", templateSetId });

      return success(undefined);
    },
    [send],
  );

  return {
    state,
    createEmptyTemplate,
    discardTemplate,
    addExercise,
    updateSet,
    removeSet,
    selectSet,
    dismissOperationError,
  };
}
