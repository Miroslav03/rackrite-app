import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import type { LiftFamily } from "@/domain/domain.types";
import type { TrendMetric } from "@/domain/progress/trends/progress.trends.types";

import { toError } from "@/shared/utils/error";
import { millisecondsUntilLocalMidnight } from "@/shared/utils/localCalendar";

import { initialProgressState, progressReducer } from "./progress.reducer";
import type { ProgressAction, ProgressState } from "./progress.types";

import type { ProgressActions } from "../actions/progressActions";

export function useProgressController(
  actions: ProgressActions,
  isFocused: boolean,
  now = Date.now,
) {
  const [state, setState] = useState<ProgressState>(initialProgressState);

  const stateRef = useRef(state);
  const activeRef = useRef(false);
  const requestVersionRef = useRef(0);
  const pendingRef = useRef(false);

  const commit = useCallback((action: ProgressAction) => {
    const next = progressReducer(stateRef.current, action);

    stateRef.current = next;
    setState(next);
  }, []);

  const load = useCallback(
    async (force = false) => {
      if (!activeRef.current || (pendingRef.current && !force)) return;

      const version = ++requestVersionRef.current;

      pendingRef.current = true;
      commit({ type: "refreshStarted" });

      try {
        const overview = await actions.loadOverview(now());

        if (activeRef.current && version === requestVersionRef.current)
          commit({ type: "refreshSucceeded", overview });
      } catch (error) {
        if (activeRef.current && version === requestVersionRef.current)
          commit({ type: "refreshFailed", error: toError(error) });
      } finally {
        if (version === requestVersionRef.current) pendingRef.current = false;
      }
    },
    [actions, commit, now],
  );

  const refresh = useCallback(() => load(), [load]);
  const selectLift = useCallback(
    (family: LiftFamily) => commit({ type: "liftSelected", family }),
    [commit],
  );
  const selectMetric = useCallback(
    (metric: TrendMetric) => commit({ type: "metricSelected", metric }),
    [commit],
  );

  useEffect(() => {
    if (!isFocused) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    function scheduleMidnight() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (activeRef.current) {
          void load(true);
          scheduleMidnight();
        }
      }, millisecondsUntilLocalMidnight(now()));
    }

    function resume() {
      if (activeRef.current) return;

      activeRef.current = true;
      void load();
      scheduleMidnight();
    }

    function suspend() {
      activeRef.current = false;
      requestVersionRef.current++;
      pendingRef.current = false;
      clearTimeout(timer);
      commit({ type: "interrupted" });
    }

    if (
      AppState.currentState !== "background" &&
      AppState.currentState !== "inactive"
    )
      resume();

    const subscription = AppState.addEventListener("change", (value) =>
      value === "active" ? resume() : suspend(),
    );

    return () => {
      activeRef.current = false;
      requestVersionRef.current++;
      pendingRef.current = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [commit, isFocused, load, now]);

  return { state, refresh, selectLift, selectMetric };
}
