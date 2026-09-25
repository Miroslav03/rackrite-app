import { createContext, useContext } from "react";

import type { TemplateSessionController } from "./useTemplateSessionController";

export const TemplateSessionContext =
  createContext<TemplateSessionController | null>(null);

export function useTemplateSession(): TemplateSessionController {
  const context = useContext(TemplateSessionContext);

  if (!context) {
    throw new Error(
      "useTemplateSession must be used inside TemplateSessionProvider",
    );
  }

  return context;
}
