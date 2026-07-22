import type { PropsWithChildren } from "react";

import type { WorkoutSessionActions } from "@/features/workout/actions/workoutSessionActions";

import { WorkoutSessionContext } from "./WorkoutSessionContext";
import { useWorkoutSessionController } from "./useWorkoutSessionController";

type WorkoutSessionProviderProps = PropsWithChildren<{
  actions: WorkoutSessionActions;
}>;

export function WorkoutSessionProvider({
  actions,
  children,
}: WorkoutSessionProviderProps) {
  const controller = useWorkoutSessionController(actions);

  return (
    <WorkoutSessionContext.Provider value={controller}>
      {children}
    </WorkoutSessionContext.Provider>
  );
}
