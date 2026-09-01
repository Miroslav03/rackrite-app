import { useCallback, useState } from "react";

import type {
  WorkoutRestTimer,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import type {
  ActiveSetEditorBasePanelType,
  ActiveSetEditorPanel,
  ActiveWorkoutDockPanel,
} from "./activeWorkoutDock.types";

type RequestedPanel = {
  workoutSetId: WorkoutSetId;
  panel: ActiveWorkoutDockPanel;
};

const DEFAULT_PANEL: ActiveSetEditorPanel = { type: "weight" };

export function useActiveWorkoutDockController(
  activeSetId: WorkoutSetId | undefined,
  restTimer: WorkoutRestTimer | null,
) {
  const [requestedPanel, setRequestedPanel] = useState<RequestedPanel | null>(
    null,
  );

  const requestedPanelIsCurrent =
    requestedPanel?.panel.type === "restTimer"
      ? requestedPanel.workoutSetId === restTimer?.sourceSetId &&
        requestedPanel.panel.startedAt === restTimer?.startedAt
      : requestedPanel?.workoutSetId === activeSetId;

  const panel =
    requestedPanel !== null && requestedPanelIsCurrent
      ? requestedPanel.panel
      : DEFAULT_PANEL;

  const openPanel = useCallback(
    (workoutSetId: WorkoutSetId, panelType: ActiveSetEditorBasePanelType) => {
      setRequestedPanel({ workoutSetId, panel: { type: panelType } });
    },
    [],
  );

  const openRestTimerPanel = useCallback(
    (sourceSetId: WorkoutSetId, startedAt: number) => {
      setRequestedPanel({
        workoutSetId: sourceSetId,
        panel: {
          type: "restTimer",
          startedAt,
        },
      });
    },
    [],
  );

  const closeRestTimerPanel = useCallback(() => {
    setRequestedPanel(null);
  }, []);

  const openWeightKeypad = useCallback(
    (workoutSetId: WorkoutSetId, draft: string) => {
      setRequestedPanel({
        workoutSetId,
        panel: { type: "weightKeypad", draft },
      });
    },
    [],
  );

  const setWeightDraft = useCallback(
    (workoutSetId: WorkoutSetId, draft: string) => {
      setRequestedPanel({
        workoutSetId,
        panel: { type: "weightKeypad", draft },
      });
    },
    [],
  );

  const openRepsKeypad = useCallback(
    (workoutSetId: WorkoutSetId, draft: string) => {
      setRequestedPanel({
        workoutSetId,
        panel: { type: "repsKeypad", draft },
      });
    },
    [],
  );

  const setRepsDraft = useCallback(
    (workoutSetId: WorkoutSetId, draft: string) => {
      setRequestedPanel({
        workoutSetId,
        panel: { type: "repsKeypad", draft },
      });
    },
    [],
  );

  return {
    panel,
    openPanel,
    openRestTimerPanel,
    closeRestTimerPanel,
    openWeightKeypad,
    openRepsKeypad,
    setWeightDraft,
    setRepsDraft,
  };
}
