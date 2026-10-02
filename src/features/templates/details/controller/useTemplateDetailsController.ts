import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";

import type { TemplateId } from "@/domain/templates/editor/templates.types";

import { failure, success, type Result } from "@/shared/types/result";
import { toError } from "@/shared/utils/error";
import {
  millisecondsUntilLocalMidnight,
  startOfLocalDay,
} from "@/shared/utils/localCalendar";

import type { TemplateDetailsActions } from "../actions/templateDetailsActions";

import {
  initialTemplateDetailsState,
  templateDetailsReducer,
} from "./templates.reducer";
import type {
  TemplateDetailsEvent,
  TemplateOperation,
} from "./templates.types";

export type TemplateDetailsController = ReturnType<
  typeof useTemplateDetailsController
>;

export function useTemplateDetailsController(
  actions: TemplateDetailsActions,
  templateId: TemplateId | undefined,
  isFocused: boolean,
  now = Date.now,
) {
  const [state, dispatch] = useReducer(
    templateDetailsReducer,
    initialTemplateDetailsState,
  );
  const [dateReference, setDateReference] = useState(() =>
    startOfLocalDay(now()),
  );

  const isActiveOperationRunningRef = useRef(false);
  const isScreenActiveRef = useRef(false);
  const stateRef = useRef(state);
  const requestVersionRef = useRef(0);

  // Commands between renders must read the latest committed state.
  const send = useCallback((event: TemplateDetailsEvent) => {
    stateRef.current = templateDetailsReducer(stateRef.current, event);
    dispatch(event);
  }, []);

  const loadDetails = useCallback(async () => {
    if (!isScreenActiveRef.current || isActiveOperationRunningRef.current)
      return;

    const version = ++requestVersionRef.current;

    setDateReference(startOfLocalDay(now()));

    if (!templateId) {
      send({ type: "loadSucceeded", template: null });
      return;
    }

    send({ type: "loadStarted" });
    try {
      const template = await actions.loadDetails(templateId);

      if (!isScreenActiveRef.current || version !== requestVersionRef.current)
        return;

      send({ type: "loadSucceeded", template });
    } catch (error) {
      if (!isScreenActiveRef.current || version !== requestVersionRef.current)
        return;

      send({ type: "loadFailed", error: toError(error) });
    }
  }, [actions, templateId, now, send]);

  const executeTemplateOperation = useCallback(
    async (
      operation: TemplateOperation,
      run: () => Promise<void>,
    ): Promise<Result<void>> => {
      const current = stateRef.current;

      if (
        !isScreenActiveRef.current ||
        current.status !== "ready" ||
        current.template.id !== templateId ||
        current.template.id !== operation.templateId
      ) {
        return failure(
          new Error("Template is not available for this operation"),
        );
      }

      if (isActiveOperationRunningRef.current) {
        return failure(
          new Error("Another template operation is already running"),
        );
      }

      isActiveOperationRunningRef.current = true;
      send({ type: "operationStarted", operation });

      try {
        await run();

        if (isScreenActiveRef.current) {
          send({ type: "operationSucceeded", operation });
        }

        return success(undefined);
      } catch (cause) {
        const error = toError(cause);

        if (isScreenActiveRef.current) {
          send({ type: "operationFailed", operation, error });
        }

        return failure(error);
      } finally {
        isActiveOperationRunningRef.current = false;
      }
    },
    [templateId, send],
  );

  const deleteTemplate = useCallback(
    (id: TemplateId) =>
      executeTemplateOperation({ type: "deleteTemplate", templateId: id }, () =>
        actions.deleteTemplate(id),
      ),
    [actions, executeTemplateOperation],
  );

  const dismissOperationError = useCallback(
    (error: Error) => {
      if (!isScreenActiveRef.current) return;
      send({ type: "operationErrorDismissed", error });
    },
    [send],
  );

  useEffect(() => {
    if (!isFocused) return;

    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    function scheduleMidnight() {
      clearTimeout(midnightTimer);

      midnightTimer = setTimeout(() => {
        if (!isScreenActiveRef.current) return;
        setDateReference(startOfLocalDay(now()));
        scheduleMidnight();
      }, millisecondsUntilLocalMidnight(now()));
    }

    function resume() {
      if (isScreenActiveRef.current) return;
      isScreenActiveRef.current = true;
      void loadDetails();
      scheduleMidnight();
    }

    function suspend() {
      isScreenActiveRef.current = false;
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

  useEffect(() => {
    const current = stateRef.current;

    if (
      !isActiveOperationRunningRef.current &&
      current.status === "ready" &&
      current.template.id !== templateId
    ) {
      void loadDetails();
    }
  }, [state, templateId, loadDetails]);

  return {
    state,
    dateReference,
    retry: loadDetails,
    deleteTemplate,
    dismissOperationError,
  };
}
