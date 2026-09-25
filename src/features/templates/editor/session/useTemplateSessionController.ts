import { useCallback, useReducer } from "react";

import { toError } from "@/shared/utils/error";

import type { TemplateSessionActions } from "../actions/templateSessionActions";

import { templatesSessionReducer } from "./templatesSession.reducer";
import type { TemplateSessionState } from "./templatesSession.types";

export type TemplateSessionController = {
  state: TemplateSessionState;
  createEmptyTemplate: () => void;
  discardTemplate: () => void;
};

export const initialTemplateSessionState: TemplateSessionState = {
  status: "noActiveTemplate",
};

export function useTemplateSessionController(
  actions: TemplateSessionActions,
): TemplateSessionController {
  const [state, dispatch] = useReducer(
    templatesSessionReducer,
    initialTemplateSessionState,
  );

  const createEmptyTemplate = useCallback(() => {
    dispatch({ type: "creationStarted" });

    try {
      const template = actions.createEmptyTemplate();

      dispatch({ type: "creationSucceeded", template });
    } catch (error) {
      dispatch({ type: "creationFailed", error: toError(error) });
    }
  }, [actions]);

  const discardTemplate = useCallback(() => {
    dispatch({ type: "templateCleared" });
  }, []);

  return { state, createEmptyTemplate, discardTemplate };
}
