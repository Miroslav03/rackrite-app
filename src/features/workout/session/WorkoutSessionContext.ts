import { createContext, useContext } from "react";

import type { WorkoutSessionController } from "./useWorkoutSessionController";

export const WorkoutSessionContext =
  createContext<WorkoutSessionController | null>(null);

export function useWorkoutSession(): WorkoutSessionController {
  const context = useContext(WorkoutSessionContext);

  if (!context) {
    throw new Error(
      "useWorkoutSession must be used inside WorkoutSessionProvider",
    );
  }

  return context;
}
