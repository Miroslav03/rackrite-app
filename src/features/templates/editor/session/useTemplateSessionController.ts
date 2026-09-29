import { useCallback, useReducer, useRef } from "react";

import { getTemplateExerciseBySetId } from "@/domain/templates/editor/templates.selectors";
import type {
  TemplateAggregate,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { isOperationPending } from "@/shared/state/operationState";
import { failure, success, type Result } from "@/shared/types/result";
import { toError } from "@/shared/utils/error";

import type {
  AddTemplateExerciseCommand,
  AddTemplateSetCommand,
  RemoveTemplateExerciseCommand,
  RemoveTemplateSetCommand,
  TemplateSessionActions,
  UpdateTemplateExerciseOrderCommand,
  UpdateTemplateSetCommand,
  UpdateTemplateMetadataCommand,
} from "../actions/templateSessionActions";

import { templatesSessionReducer } from "./templatesSession.reducer";
import type {
  CommonTemplateOperations,
  TemplateSessionEvent,
  TemplateSessionState,
} from "./templatesSession.types";

export type TemplateSessionController = {
  updateMetadata: (
    command: UpdateTemplateMetadataCommand,
  ) => Result<TemplateAggregate>;
  state: TemplateSessionState;
  createEmptyTemplate: () => void;
  createTemplate: () => Promise<Result<void>>;
  discardTemplate: () => void;
  removeExercise: (
    command: RemoveTemplateExerciseCommand,
  ) => Result<TemplateAggregate>;
  addSet: (command: AddTemplateSetCommand) => Result<TemplateAggregate>;
  updateExerciseOrder: (
    command: UpdateTemplateExerciseOrderCommand,
  ) => Result<TemplateAggregate>;
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

function isSessionPending(state: TemplateSessionState): boolean {
  return (
    (state.status === "create" || state.status === "edit") &&
    isOperationPending(state.operation)
  );
}

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
    if (isSessionPending(stateRef.current)) return;

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

  const discardTemplate = useCallback(() => {
    if (isSessionPending(stateRef.current)) return;

    send({ type: "templateCleared" });
  }, [send]);

  const createTemplate = useCallback(async (): Promise<Result<void>> => {
    const current = stateRef.current;

    if (current.status !== "create")
      return failure(new Error("No template creation in progress"));

    if (isOperationPending(current.operation))
      return failure(
        new Error("Another template operation is already running"),
      );

    const template = current.activeTemplate;
    const operation = { type: "createTemplate" } as const;

    send({ type: "createOperationStarted", operation });

    try {
      await actions.createTemplate(template);

      const latest = stateRef.current;
      if (latest.status === "create" && latest.activeTemplate === template) {
        send({ type: "templateCleared" });
      }

      return success(undefined);
    } catch (cause) {
      const error = toError(cause);
      const latest = stateRef.current;

      if (latest.status === "create" && latest.activeTemplate === template) {
        send({ type: "createOperationFailed", operation, error });
      }

      return failure(error);
    }
  }, [actions, send]);

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

      if (isOperationPending(current.operation))
        return failure(
          new Error("Another template operation is already running"),
        );

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

  const removeExercise = useCallback(
    (command: RemoveTemplateExerciseCommand) =>
      mutateTemplate({ type: "removeExercise", ...command }, (template) =>
        actions.removeExercise(template, command),
      ),
    [actions, mutateTemplate],
  );

  const addSet = useCallback(
    (command: AddTemplateSetCommand) =>
      mutateTemplate({ type: "addSet", ...command }, (template) =>
        actions.addSet(template, command),
      ),
    [actions, mutateTemplate],
  );

  const updateExerciseOrder = useCallback(
    (command: UpdateTemplateExerciseOrderCommand) =>
      mutateTemplate({ type: "updateExerciseOrder", ...command }, (template) =>
        actions.updateExerciseOrder(template, command),
      ),
    [actions, mutateTemplate],
  );

  const updateMetadata = useCallback(
    (command: UpdateTemplateMetadataCommand) =>
      mutateTemplate({ type: "updateMetadata" }, (template) =>
        actions.updateMetadata(template, command),
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

      if (isOperationPending(current.operation))
        return failure(
          new Error("Another template operation is already running"),
        );

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
    createTemplate,
    discardTemplate,
    addExercise,
    removeExercise,
    addSet,
    updateExerciseOrder,
    updateSet,
    updateMetadata,
    removeSet,
    selectSet,
    dismissOperationError,
  };
}
