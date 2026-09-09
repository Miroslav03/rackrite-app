import type { HistoryAction, HistoryState } from "./history.types";

export const initialHistoryState: HistoryState = { status: "loading" };

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case "refreshStarted":
      return state.status === "ready"
        ? {
            ...state,
            refresh: { status: "pending" },
            pagination: { status: "idle" },
          }
        : { status: "loading" };
    case "refreshSucceeded":
      return {
        status: "ready",
        ...action.page,
        totalCount: action.totalCount,
        refresh: { status: "idle" },
        pagination: { status: "idle" },
        revision: state.status === "ready" ? state.revision + 1 : 1,
      };
    case "refreshFailed":
      return state.status === "ready"
        ? { ...state, refresh: { status: "error", error: action.error } }
        : { status: "loadError", error: action.error };
    case "pageStarted":
      return state.status === "ready"
        ? { ...state, pagination: { status: "pending" } }
        : state;
    case "pageSucceeded": {
      if (state.status !== "ready") return state;
      const existingIds = new Set(state.items.map(({ id }) => id));
      return {
        ...state,
        items: [
          ...state.items,
          ...action.page.items.filter(({ id }) => !existingIds.has(id)),
        ],
        nextCursor: action.page.nextCursor,
        pagination: { status: "idle" },
      };
    }
    case "pageFailed":
      return state.status === "ready"
        ? { ...state, pagination: { status: "error", error: action.error } }
        : state;
    case "interrupted":
      return state.status === "ready"
        ? {
            ...state,
            refresh:
              state.refresh.status === "pending"
                ? { status: "idle" }
                : state.refresh,
            pagination:
              state.pagination.status === "pending"
                ? { status: "idle" }
                : state.pagination,
          }
        : state;
  }
}
