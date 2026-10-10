import type { ProgressAction, ProgressState } from "./progress.types";

export const initialProgressState: ProgressState = {
  status: "loading",
  selectedLift: "bench",
};

export function progressReducer(
  state: ProgressState,
  action: ProgressAction,
): ProgressState {
  const selection = {
    selectedLift: state.selectedLift,
  };

  switch (action.type) {
    case "liftSelected":
      return { ...state, selectedLift: action.family };
    case "refreshStarted":
      return state.status === "ready"
        ? {
            ...state,
            refresh: {
              status: "pending",
              previousError:
                state.refresh.status === "error"
                  ? state.refresh.error
                  : state.refresh.status === "pending"
                    ? state.refresh.previousError
                    : null,
            },
          }
        : { ...selection, status: "loading" };
    case "refreshSucceeded":
      return {
        ...selection,
        status: "ready",
        overview: action.overview,
        refresh: { status: "idle" },
      };
    case "refreshFailed":
      return state.status === "ready"
        ? { ...state, refresh: { status: "error", error: action.error } }
        : { ...selection, status: "loadError", error: action.error };
    case "interrupted":
      return state.status === "ready" && state.refresh.status === "pending"
        ? {
            ...state,
            refresh: state.refresh.previousError
              ? { status: "error", error: state.refresh.previousError }
              : { status: "idle" },
          }
        : state;
  }
}
