import { useCallback, useReducer, useRef } from "react";

import { getTemplateExerciseBySetId } from "@/domain/templates/editor/templates.selectors";
import type {
  TemplateAggregate,
  TemplateId,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { failure, success, type Result } from "@/shared/types/result";
import { toError } from "@/shared/utils/error";

import type {
  AddTemplateExerciseCommand,
  AddTemplateSetCommand,
  RemoveTemplateExerciseCommand,
  RemoveTemplateSetCommand,
  TemplateSessionActions,
  UpdateTemplateExerciseOrderCommand,
  UpdateTemplateMetadataCommand,
  UpdateTemplateSetCommand,
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
  editTemplate: (templateId: TemplateId) => Promise<Result<void>>;
  updateTemplate: () => Promise<Result<void>>;
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

export function useTemplateSessionController(
  actions: TemplateSessionActions,
): TemplateSessionController {
  const [state, dispatch] = useReducer(
    templatesSessionReducer,
    initialTemplateSessionState,
  );

  const stateRef = useRef(state);
  const isActiveOperationRunningRef = useRef(false);

  // Commands in one render must build on the previous command's committed draft.
  const send = useCallback((event: TemplateSessionEvent) => {
    stateRef.current = templatesSessionReducer(stateRef.current, event);
    dispatch(event);
  }, []);

  const createEmptyTemplate = useCallback(() => {
    if (isActiveOperationRunningRef.current) return;

    isActiveOperationRunningRef.current = true;
    send({ type: "creationStarted" });

    try {
      send({
        type: "creationSucceeded",
        template: actions.createEmptyTemplate(),
      });
    } catch (error) {
      send({ type: "creationFailed", error: toError(error) });
    } finally {
      isActiveOperationRunningRef.current = false;
    }
  }, [actions, send]);

  const editTemplate = useCallback(
    async (templateId: TemplateId): Promise<Result<void>> => {
      if (isActiveOperationRunningRef.current) {
        return failure(
          new Error("Another template operation is already running"),
        );
      }

      isActiveOperationRunningRef.current = true;
      send({ type: "editingStarted" });

      try {
        const template = await actions.loadTemplate(templateId);
        send({ type: "editingSucceeded", template });

        return success(undefined);
      } catch (cause) {
        const error = toError(cause);
        send({ type: "editingFailed", error });

        return failure(error);
      } finally {
        isActiveOperationRunningRef.current = false;
      }
    },
    [actions, send],
  );

  const discardTemplate = useCallback(() => {
    if (isActiveOperationRunningRef.current) return;

    send({ type: "templateCleared" });
  }, [send]);

  const saveTemplate = useCallback(
    async (mode: "create" | "edit"): Promise<Result<void>> => {
      const current = stateRef.current;

      if (current.status !== mode) {
        return failure(
          new Error(
            mode === "create"
              ? "No template creation in progress"
              : "No template editing in progress",
          ),
        );
      }

      if (isActiveOperationRunningRef.current) {
        return failure(
          new Error("Another template operation is already running"),
        );
      }

      isActiveOperationRunningRef.current = true;
      send(
        current.status === "create"
          ? {
              type: "createOperationStarted",
              operation: { type: "createTemplate" },
            }
          : {
              type: "editOperationStarted",
              operation: { type: "editTemplate" },
            },
      );

      try {
        if (current.status === "create") {
          await actions.createTemplate(current.activeTemplate);
        } else {
          await actions.updateTemplate(
            current.originalTemplate,
            current.activeTemplate,
          );
        }

        send({ type: "templateCleared" });
        return success(undefined);
      } catch (cause) {
        const error = toError(cause);
        send(
          current.status === "create"
            ? {
                type: "createOperationFailed",
                operation: { type: "createTemplate" },
                error,
              }
            : {
                type: "editOperationFailed",
                operation: { type: "editTemplate" },
                error,
              },
        );
        return failure(error);
      } finally {
        isActiveOperationRunningRef.current = false;
      }
    },
    [actions, send],
  );

  const createTemplate = useCallback(
    () => saveTemplate("create"),
    [saveTemplate],
  );
  const updateTemplate = useCallback(
    () => saveTemplate("edit"),
    [saveTemplate],
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

      if (isActiveOperationRunningRef.current)
        return failure(
          new Error("Another template operation is already running"),
        );

      isActiveOperationRunningRef.current = true;
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
      } finally {
        isActiveOperationRunningRef.current = false;
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

      if (isActiveOperationRunningRef.current)
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
    editTemplate,
    updateTemplate,
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
