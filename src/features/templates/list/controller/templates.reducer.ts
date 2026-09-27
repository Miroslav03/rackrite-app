import type { TemplatesAction, TemplatesState } from "./templates.types";

export const initialTemplatesState: TemplatesState = { status: "loading" };

export function templatesReducer(
  state: TemplatesState,
  action: TemplatesAction,
): TemplatesState {
  switch (action.type) {
    case "refreshStarted":
      return state.status === "ready"
        ? { ...state, refresh: { status: "pending" } }
        : { status: "loading" };

    case "refreshSucceeded":
      return {
        status: "ready",
        items: action.items,
        refresh: { status: "idle" },
        revision: state.status === "ready" ? state.revision + 1 : 1,
      };

    case "refreshFailed":
      return state.status === "ready"
        ? { ...state, refresh: { status: "error", error: action.error } }
        : { status: "loadError", error: action.error };

    case "interrupted":
      return state.status === "ready" && state.refresh.status === "pending"
        ? { ...state, refresh: { status: "idle" } }
        : state;
  }
}
