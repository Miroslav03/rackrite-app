import type { PropsWithChildren } from "react";

import type { TemplateSessionActions } from "../actions/templateSessionActions";

import { TemplateSessionContext } from "./TemplateSessionContext";
import { useTemplateSessionController } from "./useTemplateSessionController";

type TemplateSessionProviderProps = PropsWithChildren<{
  actions: TemplateSessionActions;
}>;

export function TemplateSessionProvider({
  actions,
  children,
}: TemplateSessionProviderProps) {
  const controller = useTemplateSessionController(actions);

  return (
    <TemplateSessionContext.Provider value={controller}>
      {children}
    </TemplateSessionContext.Provider>
  );
}
