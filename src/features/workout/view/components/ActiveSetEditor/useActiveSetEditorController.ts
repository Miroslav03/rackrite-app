import { useCallback, useState } from "react";

import type { WorkoutSetId } from "@/domain/workout/workout.types";

import type {
  ActiveSetEditorPanel,
  ActiveSetEditorPanelType
} from "./activeSetEditor.types";

type RequestedPanel = {
  workoutSetId: WorkoutSetId;
  panel: ActiveSetEditorPanel;
};

const DEFAULT_PANEL: ActiveSetEditorPanel = { type: "weight" };

export function useActiveSetEditorController(
  activeSetId: WorkoutSetId | undefined,
) {
  const [requestedPanel, setRequestedPanel] = useState<RequestedPanel | null>(
    null,
  );

  const panel =
    requestedPanel && requestedPanel.workoutSetId === activeSetId
      ? requestedPanel.panel
      : DEFAULT_PANEL;

  const openPanel = useCallback(
    (
      workoutSetId: WorkoutSetId,
      panelType: Exclude<ActiveSetEditorPanelType, "weightKeypad">,
    ) => {
      setRequestedPanel({ workoutSetId, panel: { type: panelType } });
    },
    [],
  );

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

  return { panel, openPanel, openWeightKeypad, setWeightDraft };
}
