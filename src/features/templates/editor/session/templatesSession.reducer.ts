import { getTemplateExerciseBySetId } from "@/domain/templates/editor/templates.selectors";

import type {
  TemplateSessionEvent,
  TemplateSessionState,
} from "./templatesSession.types";

export function templatesSessionReducer(
  state: TemplateSessionState,
  event: TemplateSessionEvent,
): TemplateSessionState {
  switch (event.type) {
    case "creationStarted":
    case "editingStarted":
      return { status: "loading" };

    case "creationSucceeded":
      if (state.status !== "loading") return state;

      return {
        status: "create",
        activeSetId: null,
        activeTemplate: event.template,
        operation: { status: "idle" },
      };

    case "editingSucceeded":
      if (state.status !== "loading") return state;

      return {
        status: "edit",
        activeSetId: null,
        originalTemplate: event.template,
        activeTemplate: event.template,
        operation: { status: "idle" },
      };
    case "creationFailed":
    case "editingFailed":
      if (state.status !== "loading") return state;

      return { status: "loadError", error: event.error };

    case "createOperationStarted":
      if (state.status !== "create") return state;

      return {
        ...state,
        operation: { status: "pending", operation: event.operation },
      };

    case "editOperationStarted":
      if (state.status !== "edit") return state;

      return {
        ...state,
        operation: { status: "pending", operation: event.operation },
      };

    case "createOperationFailed":
      if (state.status !== "create") return state;

      return {
        ...state,
        operation: {
          status: "error",
          operation: event.operation,
          error: event.error,
        },
      };

    case "editOperationFailed":
      if (state.status !== "edit") return state;

      return {
        ...state,
        operation: {
          status: "error",
          operation: event.operation,
          error: event.error,
        },
      };

    case "operationErrorDismissed":
      if (state.status !== "create" && state.status !== "edit") return state;

      if (
        state.operation.status !== "error" ||
        state.operation.error !== event.error
      )
        return state;

      return { ...state, operation: { status: "idle" } };

    case "setSelected":
      if (state.status !== "create" && state.status !== "edit") return state;

      if (
        event.templateSetId !== null &&
        !getTemplateExerciseBySetId(state.activeTemplate, event.templateSetId)
      )
        return state;

      return { ...state, activeSetId: event.templateSetId };

    case "templateCommitted": {
      if (state.status !== "create" && state.status !== "edit") return state;

      if (state.activeTemplate.template.id !== event.template.template.id)
        return state;

      const activeSetId =
        state.activeSetId !== null &&
        getTemplateExerciseBySetId(event.template, state.activeSetId)
          ? state.activeSetId
          : null;

      return {
        ...state,
        activeTemplate: event.template,
        activeSetId,
        operation: { status: "idle" },
      };
    }
    case "templateCleared":
      return { status: "noActiveTemplate" };
  }
}
