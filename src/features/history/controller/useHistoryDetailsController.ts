import { useCallback, useEffect, useRef, useState } from "react";

import type { HistoryWorkoutDetails } from "@/domain/history/history.types";

import { toError } from "@/shared/utils/error";

import type { HistoryActions } from "../actions/historyActions";

export type HistoryDetailsState =
  | { status: "loading" }
  | { status: "loadError"; error: Error }
  | { status: "unavailable" }
  | { status: "ready"; workout: HistoryWorkoutDetails };

export function useHistoryDetailsController(
  actions: Pick<HistoryActions, "loadDetails">,
  workoutId: string | undefined,
  isFocused: boolean,
) {
  const [state, setState] = useState<HistoryDetailsState>({
    status: "loading",
  });

  const requestVersionRef = useRef(0);

  const loadDetails = useCallback(async () => {
    if (!isFocused) return;

    const version = ++requestVersionRef.current;

    if (!workoutId) {
      setState({ status: "unavailable" });
      return;
    }

    setState({ status: "loading" });

    try {
      const workout = await actions.loadDetails(workoutId);
      if (version !== requestVersionRef.current) return;

      setState(
        workout ? { status: "ready", workout } : { status: "unavailable" },
      );
    } catch (error) {
      if (version !== requestVersionRef.current) return;

      setState({ status: "loadError", error: toError(error) });
    }
  }, [actions, workoutId, isFocused]);

  useEffect(() => {
    void loadDetails();

    return () => {
      requestVersionRef.current += 1;
    };
  }, [loadDetails]);

  return { state, retry: loadDetails };
}
