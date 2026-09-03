import { useCallback, useEffect, useRef } from "react";

import type { SetType } from "@/domain/domain.types";
import {
  getActiveWorkoutExercise,
  getActiveWorkoutSet,
  getWorkoutSetById,
} from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutRestTimer,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import type { RestTimerAdjustmentSeconds } from "@/features/workout/actions/adjustRestTimer";
import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import {
  SET_VALUE_UPDATE_DEBOUNCE_MS,
  type RpePickerValue,
} from "@/features/workout/view/activeWorkout.config";

import type { InteractiveKeypadKey } from "@/shared/components/ui/InteractiveKeypad";
import { useDebouncedCallback } from "@/shared/hooks/useDebouncedCallback";

import {
  addWeightIncrement,
  formatKeypadDraft,
  parseKeypadDraft,
  updateKeypadDraft,
} from "./activeSetEditorKeypad.utils";
import type { ActiveSetEditorPanelType } from "./activeWorkoutDock.types";
import {
  isActiveSetEditorKeypadPanel,
  isRepsKeypadPanel,
  isWeightKeypadPanel,
} from "./activeWorkoutDock.types.utils";
import { useActiveWorkoutDockController } from "./useActiveWorkoutDockController";

type ActiveDockActions = Pick<
  WorkoutSessionController,
  | "updateSet"
  | "selectSet"
  | "completeSet"
  | "undoCompletedSet"
  | "adjustRestTimer"
  | "resetRestTimer"
  | "skipRestTimer"
>;

type SetValueDraftUpdate = {
  workoutSetId: WorkoutSetId;
  draft: string;
};

export function useActiveWorkoutDockEditor(
  workout: WorkoutAggregate,
  actions: ActiveDockActions,
) {
  const activeSet = getActiveWorkoutSet(workout);
  const activeExercise = getActiveWorkoutExercise(workout);

  const panelController = useActiveWorkoutDockController(
    activeSet?.id,
    workout.workout.restTimer,
  );

  const { schedule: scheduleWeightUpdate, flush: flushWeightUpdate } =
    useDebouncedCallback(
      ({ workoutSetId, draft }: SetValueDraftUpdate) =>
        actions.updateSet({
          workoutSetId,
          values: { weight: parseKeypadDraft(draft, "weight") },
        }),
      SET_VALUE_UPDATE_DEBOUNCE_MS,
    );

  const { schedule: scheduleRepsUpdate, flush: flushRepsUpdate } =
    useDebouncedCallback(
      ({ workoutSetId, draft }: SetValueDraftUpdate) =>
        actions.updateSet({
          workoutSetId,
          values: { reps: parseKeypadDraft(draft, "reps") },
        }),
      SET_VALUE_UPDATE_DEBOUNCE_MS,
    );

  const weightKeypadOpen = isWeightKeypadPanel(panelController.panel);
  const repsKeypadOpen = isRepsKeypadPanel(panelController.panel);

  const savePendingKeypadUpdate = useCallback(async () => {
    if (weightKeypadOpen) {
      return (await flushWeightUpdate())?.success ?? true;
    }

    if (repsKeypadOpen) {
      return (await flushRepsUpdate())?.success ?? true;
    }

    return true;
  }, [flushRepsUpdate, flushWeightUpdate, repsKeypadOpen, weightKeypadOpen]);

  const openSetEditor = async (
    nextWorkoutSetId: WorkoutSetId,
    nextPanelType: ActiveSetEditorPanelType,
  ) => {
    const isChangingSet = workout.workout.activeSetId !== nextWorkoutSetId;
    const isChangingPanel = panelController.panel.type !== nextPanelType;

    if (!isChangingSet && !isChangingPanel) {
      return;
    }

    const isLeavingKeypad = isActiveSetEditorKeypadPanel(panelController.panel);

    if (isLeavingKeypad && !(await savePendingKeypadUpdate())) {
      return;
    }

    if (isChangingSet) {
      const result = await actions.selectSet({
        workoutSetId: nextWorkoutSetId,
      });

      if (!result.success) {
        return;
      }
    }

    if (nextPanelType === "weightKeypad") {
      const workoutSet = getWorkoutSetById(workout, nextWorkoutSetId);

      if (!workoutSet) {
        return;
      }

      panelController.openWeightKeypad(
        nextWorkoutSetId,
        formatKeypadDraft(workoutSet.weight),
      );

      return;
    }

    if (nextPanelType === "repsKeypad") {
      const workoutSet = getWorkoutSetById(workout, nextWorkoutSetId);

      if (!workoutSet) {
        return;
      }

      panelController.openRepsKeypad(
        nextWorkoutSetId,
        formatKeypadDraft(workoutSet.reps),
      );

      return;
    }

    panelController.openPanel(nextWorkoutSetId, nextPanelType);
  };

  const latestOpenSetEditorRef = useRef(openSetEditor);

  useEffect(() => {
    latestOpenSetEditorRef.current = openSetEditor;
  });

  const openSetEditorMemoized = useCallback(
    (nextWorkoutSetId: WorkoutSetId, nextPanelType: ActiveSetEditorPanelType) =>
      latestOpenSetEditorRef.current(nextWorkoutSetId, nextPanelType),
    [],
  );

  function showRestTimerPanel(restTimer: WorkoutRestTimer) {
    panelController.openRestTimerPanel(
      restTimer.sourceSetId,
      restTimer.startedAt,
    );
  }

  async function openRestTimerDock(restTimer: WorkoutRestTimer) {
    if (!(await savePendingKeypadUpdate())) {
      return false;
    }

    showRestTimerPanel(restTimer);
  }

  async function adjustRestTimer(seconds: RestTimerAdjustmentSeconds) {
    const result = await actions.adjustRestTimer({ seconds });

    if (result.success && result.value.workout.restTimer === null) {
      panelController.closeRestTimerPanel();
    }
  }

  async function resetRestTimer() {
    const result = await actions.resetRestTimer();
    const nextTimer = result.success ? result.value.workout.restTimer : null;

    if (!nextTimer) {
      if (result.success) {
        panelController.closeRestTimerPanel();
      }

      return;
    }

    showRestTimerPanel(nextTimer);
  }

  async function skipRestTimer() {
    if (!(await savePendingKeypadUpdate())) {
      return;
    }

    const result = await actions.skipRestTimer();

    if (result.success) {
      panelController.closeRestTimerPanel();
    }
  }

  function adjustWeight(increment: number) {
    if (!activeSet) return;

    void actions.updateSet({
      workoutSetId: activeSet.id,
      values: {
        weight: addWeightIncrement(activeSet.weight, increment),
      },
    });
  }

  async function toggleKeypad() {
    if (!activeSet) return;

    if (isActiveSetEditorKeypadPanel(panelController.panel)) {
      if (!(await savePendingKeypadUpdate())) {
        return;
      }

      panelController.openPanel(activeSet.id, "weight");

      return;
    }

    panelController.openWeightKeypad(
      activeSet.id,
      formatKeypadDraft(activeSet.weight),
    );
  }

  function pressWeightKey(key: InteractiveKeypadKey) {
    if (!activeSet || !isWeightKeypadPanel(panelController.panel)) {
      return;
    }

    const draft = updateKeypadDraft(panelController.panel.draft, key, "weight");

    if (draft === panelController.panel.draft) {
      return;
    }

    panelController.setWeightDraft(activeSet.id, draft);
    scheduleWeightUpdate({ workoutSetId: activeSet.id, draft });
  }

  function pressRepsKey(key: InteractiveKeypadKey) {
    if (!activeSet || !isRepsKeypadPanel(panelController.panel)) {
      return;
    }

    const draft = updateKeypadDraft(panelController.panel.draft, key, "reps");

    if (draft === panelController.panel.draft) {
      return;
    }

    panelController.setRepsDraft(activeSet.id, draft);
    scheduleRepsUpdate({ workoutSetId: activeSet.id, draft });
  }

  function selectRpe(rpe: RpePickerValue | null) {
    if (!activeSet) return;

    void actions.updateSet({
      workoutSetId: activeSet.id,
      values: { rpe },
    });
  }

  function selectSetType(setType: SetType) {
    if (!activeSet) return;

    void actions.updateSet({
      workoutSetId: activeSet.id,
      values: { type: setType },
    });
  }

  async function completeSet() {
    if (!activeSet) return;

    const completedSetId = activeSet.id;

    const result = await actions.completeSet({
      workoutSetId: completedSetId,
    });

    if (!result.success) {
      return;
    }

    const nextRestTimer = result.value.workout.restTimer;

    if (nextRestTimer?.sourceSetId !== completedSetId) {
      return;
    }

    showRestTimerPanel(nextRestTimer);
  }

  function undoCompletedSet() {
    if (!activeSet || activeSet.finishedAt === null) {
      return;
    }

    void actions.undoCompletedSet({ workoutSetId: activeSet.id });
  }

  return {
    activeSet,
    activeExercise,
    panel: panelController.panel,
    weightDraft: isWeightKeypadPanel(panelController.panel)
      ? panelController.panel.draft
      : undefined,
    repsDraft: isRepsKeypadPanel(panelController.panel)
      ? panelController.panel.draft
      : undefined,
    openSetEditor: openSetEditorMemoized,
    openRestTimerDock,
    closeRestTimerDock: panelController.closeRestTimerPanel,
    adjustRestTimer,
    resetRestTimer,
    skipRestTimer,
    adjustWeight,
    toggleKeypad,
    pressWeightKey,
    pressRepsKey,
    selectRpe,
    selectSetType,
    completeSet,
    undoCompletedSet,
    savePendingKeypadUpdate,
  };
}
