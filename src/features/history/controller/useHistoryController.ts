import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { toError } from "@/shared/utils/error";
import {
  millisecondsUntilLocalMidnight,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import { HistoryActions } from "../actions/historyActions";

import { historyReducer, initialHistoryState } from "./history.reducer";
import type { HistoryAction, HistoryState } from "./history.types";

export function useHistoryController(
  actions: HistoryActions,
  isFocused: boolean,
  now = Date.now,
) {
  const [state, setState] = useState<HistoryState>(initialHistoryState);
  const [dateReference, setDateReference] = useState(() =>
    startOfLocalDay(now()),
  );

  const stateRef = useRef(state);
  const activeRef = useRef(false);
  const requestVersionRef = useRef(0);

  // Publish state to request guards immediately, before React's next render.
  const commit = useCallback((action: HistoryAction) => {
    const next = historyReducer(stateRef.current, action);

    stateRef.current = next;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!activeRef.current) return;

    const version = ++requestVersionRef.current;

    commit({ type: "refreshStarted" });
    setDateReference(startOfLocalDay(now()));
    try {
      const overview = await actions.loadOverview();

      if (!activeRef.current || version !== requestVersionRef.current) return;

      commit({ type: "refreshSucceeded", ...overview });
    } catch (error) {
      if (!activeRef.current || version !== requestVersionRef.current) return;

      commit({ type: "refreshFailed", error: toError(error) });
    }
  }, [actions, commit, now]);

  const loadPage = useCallback(
    async (retry: boolean) => {
      const current = stateRef.current;
      if (
        !activeRef.current ||
        current.status !== "ready" ||
        current.nextCursor === null ||
        current.refresh.status !== "idle" ||
        current.pagination.status === "pending" ||
        (current.pagination.status === "error" && !retry)
      )
        return;

      const version = ++requestVersionRef.current;
      commit({ type: "pageStarted" });

      try {
        const page = await actions.loadNextPage(current.nextCursor);
        if (!activeRef.current || version !== requestVersionRef.current) return;

        commit({ type: "pageSucceeded", page });
      } catch (error) {
        if (!activeRef.current || version !== requestVersionRef.current) return;

        commit({ type: "pageFailed", error: toError(error) });
      }
    },
    [actions, commit],
  );

  const loadNextPage = useCallback(() => loadPage(false), [loadPage]);
  const retryNextPage = useCallback(() => loadPage(true), [loadPage]);

  useEffect(() => {
    if (!isFocused) return;
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    function scheduleMidnight() {
      clearTimeout(midnightTimer);
      midnightTimer = setTimeout(() => {
        setDateReference(startOfLocalDay(now()));
        scheduleMidnight();
      }, millisecondsUntilLocalMidnight(now()));
    }

    function resume() {
      if (activeRef.current) return;
      activeRef.current = true;
      void refresh();
      scheduleMidnight();
    }

    function suspend() {
      activeRef.current = false;
      requestVersionRef.current += 1;
      clearTimeout(midnightTimer);
    }

    if (
      AppState.currentState !== "background" &&
      AppState.currentState !== "inactive"
    )
      resume();
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") {
        resume();
      } else {
        suspend();
        commit({ type: "interrupted" });
      }
    });

    return () => {
      suspend();
      subscription.remove();
    };
  }, [commit, isFocused, now, refresh]);

  return { state, dateReference, refresh, loadNextPage, retryNextPage };
}
