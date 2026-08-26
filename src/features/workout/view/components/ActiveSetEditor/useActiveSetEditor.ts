import type { SetType } from "@/domain/domain.types";
import {
  getActiveUnfinishedWorkoutSet,
  getActiveWorkoutExercise,
  getWorkoutSetById,
} from "@/domain/workout/workout.selectors";
import type {
  WorkoutAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import {
  SET_VALUE_UPDATE_DEBOUNCE_MS,
  type RpePickerValue,
} from "@/features/workout/view/activeWorkout.config";

import type { InteractiveKeypadKey } from "@/shared/components/ui/InteractiveKeypad";
import { useDebouncedCallback } from "@/shared/hooks/useDebouncedCallback";

import type { ActiveSetEditorPanelType } from "./activeSetEditor.types";
import {
  isActiveSetEditorKeypadPanel,
  isRepsKeypadPanel,
  isWeightKeypadPanel,
} from "./activeSetEditor.utils";
import {
  addWeightIncrement,
  formatKeypadDraft,
  parseKeypadDraft,
  updateKeypadDraft,
} from "./activeSetEditorKeypad.utils";
import { useActiveSetEditorController } from "./useActiveSetEditorController";

type ActiveSetActions = Pick<
  WorkoutSessionController,
  "updateSet" | "selectSet" | "completeSet"
>;

type SetValueDraftUpdate = {
  workoutSetId: WorkoutSetId;
  draft: string;
};

export function useActiveSetEditor(
  workout: WorkoutAggregate,
  actions: ActiveSetActions,
) {
  const activeExercise = getActiveWorkoutExercise(workout);
  const activeSet = getActiveUnfinishedWorkoutSet(workout);

  const panelController = useActiveSetEditorController(activeSet?.id);

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

  async function savePendingKeypadUpdate() {
    if (isWeightKeypadPanel(panelController.panel)) {
      return (await flushWeightUpdate())?.success ?? true;
    }

    if (isRepsKeypadPanel(panelController.panel)) {
      return (await flushRepsUpdate())?.success ?? true;
    }

    return true;
  }

  async function openSetEditor(
    nextWorkoutSetId: WorkoutSetId,
    nextPanelType: ActiveSetEditorPanelType,
  ) {
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

  function completeSet() {
    if (!activeSet) return;

    void actions.completeSet({ workoutSetId: activeSet.id });
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
    openSetEditor,
    adjustWeight,
    toggleKeypad,
    pressWeightKey,
    pressRepsKey,
    selectRpe,
    selectSetType,
    completeSet,
  };
}
