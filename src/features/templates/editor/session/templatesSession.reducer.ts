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
      return { status: "loading" };

    case "creationSucceeded":
      if (state.status !== "loading") return state;

      return {
        status: "create",
        activeSetId: null,
        activeTemplate: event.template,
        operation: { status: "idle" },
      };

    case "creationFailed":
      if (state.status !== "loading") return state;

      return { status: "loadError", error: event.error };

    case "templateCleared":
      return { status: "noActiveTemplate" };
  }
}
