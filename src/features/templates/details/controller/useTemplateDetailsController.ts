import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import type { TemplateDetails } from "@/domain/templates/details/templates.types";
import type { TemplateId } from "@/domain/templates/editor/templates.types";

import { toError } from "@/shared/utils/error";
import {
  millisecondsUntilLocalMidnight,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import type { TemplateDetailsActions } from "../actions/templateDetailsActions";

export type TemplateDetailsState =
  | { status: "loading" }
  | { status: "loadError"; error: Error }
  | { status: "unavailable" }
  | { status: "ready"; template: TemplateDetails };

export function useTemplateDetailsController(
  actions: TemplateDetailsActions,
  templateId: TemplateId | undefined,
  isFocused: boolean,
  now = Date.now,
) {
  const [state, setState] = useState<TemplateDetailsState>({
    status: "loading",
  });
  const [dateReference, setDateReference] = useState(() =>
    startOfLocalDay(now()),
  );

  const activeRef = useRef(false);
  const requestVersionRef = useRef(0);

  const loadDetails = useCallback(async () => {
    if (!activeRef.current) return;

    const version = ++requestVersionRef.current;

    setDateReference(startOfLocalDay(now()));

    if (!templateId) {
      setState({ status: "unavailable" });
      return;
    }

    setState({ status: "loading" });
    try {
      const template = await actions.loadDetails(templateId);

      if (!activeRef.current || version !== requestVersionRef.current) return;

      setState(
        template ? { status: "ready", template } : { status: "unavailable" },
      );
    } catch (error) {
      if (!activeRef.current || version !== requestVersionRef.current) return;

      setState({ status: "loadError", error: toError(error) });
    }
  }, [actions, templateId, now]);

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
      void loadDetails();
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
      if (appState === "active") resume();
      else suspend();
    });

    return () => {
      suspend();
      subscription.remove();
    };
  }, [isFocused, loadDetails, now]);

  return { state, dateReference, retry: loadDetails };
}
