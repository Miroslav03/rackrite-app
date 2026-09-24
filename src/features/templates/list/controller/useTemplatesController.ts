import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { toError } from "@/shared/utils/error";
import {
  millisecondsUntilLocalMidnight,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import type { TemplatesActions } from "../actions/templatesActions";

import { initialTemplatesState, templatesReducer } from "./templates.reducer";
import type { TemplatesAction, TemplatesState } from "./templates.types";

export function useTemplatesController(
  actions: TemplatesActions,
  isFocused: boolean,
  now = Date.now,
) {
  const [state, setState] = useState<TemplatesState>(initialTemplatesState);
  const [dateReference, setDateReference] = useState(() =>
    startOfLocalDay(now()),
  );

  const stateRef = useRef(state);
  const activeRef = useRef(false);
  const requestVersionRef = useRef(0);

  // Publish state to request guards before React's next render.
  const commit = useCallback((action: TemplatesAction) => {
    const next = templatesReducer(stateRef.current, action);

    stateRef.current = next;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!activeRef.current) return;

    const version = ++requestVersionRef.current;

    commit({ type: "refreshStarted" });
    setDateReference(startOfLocalDay(now()));

    try {
      const items = await actions.loadTemplates();

      if (!activeRef.current || version !== requestVersionRef.current) return;

      commit({ type: "refreshSucceeded", items });
    } catch (error) {
      if (!activeRef.current || version !== requestVersionRef.current) return;

      commit({ type: "refreshFailed", error: toError(error) });
    }
  }, [actions, commit, now]);

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
    ) {
      resume();
    }
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

  return { state, dateReference, refresh };
}
