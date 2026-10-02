import type {
  TemplateDetailsEvent,
  TemplateDetailsState,
} from "./templates.types";

export const initialTemplateDetailsState: TemplateDetailsState = {
  status: "loading",
};

export function templateDetailsReducer(
  state: TemplateDetailsState,
  event: TemplateDetailsEvent,
): TemplateDetailsState {
  switch (event.type) {
    case "loadStarted":
      return { status: "loading" };

    case "loadSucceeded":
      return event.template
        ? {
            status: "ready",
            template: event.template,
            operation: { status: "idle" },
          }
        : { status: "unavailable" };

    case "loadFailed":
      return { status: "loadError", error: event.error };

    case "operationStarted":
      if (
        state.status !== "ready" ||
        state.template.id !== event.operation.templateId ||
        state.operation.status === "pending"
      ) {
        return state;
      }

      return {
        ...state,
        operation: { status: "pending", operation: event.operation },
      };

    case "operationSucceeded":
    case "operationFailed":
      if (
        state.status !== "ready" ||
        state.operation.status !== "pending" ||
        state.operation.operation !== event.operation
      ) {
        return state;
      }

      return {
        ...state,
        operation:
          event.type === "operationSucceeded"
            ? { status: "idle" }
            : {
                status: "error",
                operation: event.operation,
                error: event.error,
              },
      };

    case "operationErrorDismissed":
      if (
        state.status !== "ready" ||
        state.operation.status !== "error" ||
        state.operation.error !== event.error
      ) {
        return state;
      }

      return { ...state, operation: { status: "idle" } };
  }
}
