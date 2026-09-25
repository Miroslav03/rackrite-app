import { useCallback, useEffect, useRef } from "react";

import type { SetType } from "@/domain/domain.types";
import {
  getTemplateExerciseBySetId,
  getTemplateSetById,
} from "@/domain/templates/editor/templates.selectors";
import type {
  TemplateAggregate,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import type { RpePickerValue } from "@/shared/components/exercise-editor/RpePickerPanel";
import {
  formatKeypadDraft,
  parseKeypadDraft,
  updateKeypadDraft,
} from "@/shared/components/exercise-editor/setEditorKeypad.utils";
import { isRepsKeypadPanel } from "@/shared/components/exercise-editor/setEditorPanel.types.utils";
import type { InteractiveKeypadKey } from "@/shared/components/ui/InteractiveKeypad";
import { useDebouncedCallback } from "@/shared/hooks/useDebouncedCallback";

import type { TemplateSessionController } from "../../session/useTemplateSessionController";

import {
  TEMPLATE_REPS_UPDATE_DEBOUNCE_MS,
  type TemplateEditorPanelType,
} from "./templateEditorDock.types";
import { useTemplateEditorDockController } from "./useTemplateEditorDockController";

type TemplateDockActions = Pick<
  TemplateSessionController,
  "updateSet" | "selectSet"
>;

type RepsUpdate = { templateSetId: TemplateSetId; reps: number };

export function useTemplateEditorDockEditor(
  template: TemplateAggregate,
  activeSetId: TemplateSetId | null,
  actions: TemplateDockActions,
) {
  const activeExercise =
    activeSetId === null
      ? undefined
      : getTemplateExerciseBySetId(template, activeSetId);
  const activeSet = activeExercise?.sets.find((set) => set.id === activeSetId);

  const controller = useTemplateEditorDockController(activeSet?.id ?? null);
  const { openPanel, closePanel, getRequestedPanel } = controller;

  const transitionRef = useRef(0);
  const templateRef = useRef(template);

  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  const { schedule, flush, cancel } = useDebouncedCallback(
    ({ templateSetId, reps }: RepsUpdate) =>
      actions.updateSet({ templateSetId, values: { reps } }),
    TEMPLATE_REPS_UPDATE_DEBOUNCE_MS,
  );

  const savePendingKeypadUpdate = useCallback(async () => {
    const result = await flush();

    if (result !== undefined) {
      if (!result.success) return false;
      templateRef.current = result.value;
    }

    // Retry a failed timed update when the user tries to leave the field.
    const requested = getRequestedPanel();

    if (!requested || !isRepsKeypadPanel(requested?.panel)) {
      return true;
    }

    const reps = parseKeypadDraft(requested.panel.draft, "reps");

    const set = getTemplateSetById(
      templateRef.current,
      requested.templateSetId,
    );

    if (!set) {
      return false;
    }

    if (reps === null) {
      openPanel(set.id, {
        type: "repsKeypad",
        draft: formatKeypadDraft(set.reps),
      });

      return true;
    }

    cancel();

    if (set.reps === reps) {
      return true;
    }

    const update = actions.updateSet({
      templateSetId: set.id,
      values: { reps },
    });

    if (update.success) {
      templateRef.current = update.value;
    }

    return update.success;
  }, [actions, cancel, flush, getRequestedPanel, openPanel]);

  const openSetEditor = useCallback(
    async (templateSetId: TemplateSetId, type: TemplateEditorPanelType) => {
      const request = ++transitionRef.current;
      const previous = getRequestedPanel();

      if (
        previous?.templateSetId === templateSetId &&
        previous.panel.type === type
      )
        return;

      if (
        !(await savePendingKeypadUpdate()) ||
        request !== transitionRef.current
      )
        return;

      const set = getTemplateSetById(templateRef.current, templateSetId);

      if (!set || !actions.selectSet(templateSetId).success) return;

      openPanel(
        templateSetId,
        type === "repsKeypad"
          ? { type, draft: formatKeypadDraft(set.reps) }
          : { type },
      );
    },
    [actions, getRequestedPanel, openPanel, savePendingKeypadUpdate],
  );

  const closeSetEditor = useCallback(async () => {
    const request = ++transitionRef.current;

    if (
      !(await savePendingKeypadUpdate()) ||
      request !== transitionRef.current
    ) {
      return false;
    }

    if (!actions.selectSet(null).success) {
      return false;
    }

    closePanel();

    return true;
  }, [actions, closePanel, savePendingKeypadUpdate]);

  const cancelPendingUpdates = useCallback(() => {
    transitionRef.current += 1;

    cancel();
    closePanel();
  }, [cancel, closePanel]);

  useEffect(() => {
    if (!activeSet) cancelPendingUpdates();
  }, [activeSet, cancelPendingUpdates]);

  function pressRepsKey(key: InteractiveKeypadKey) {
    const requested = getRequestedPanel();

    if (!requested || !isRepsKeypadPanel(requested.panel)) {
      return;
    }

    const draft = updateKeypadDraft(requested.panel.draft, key, "reps");

    if (draft === requested.panel.draft) {
      return;
    }

    transitionRef.current += 1;

    openPanel(requested.templateSetId, { type: "repsKeypad", draft });
    cancel();

    const reps = parseKeypadDraft(draft, "reps");

    if (reps !== null)
      schedule({ templateSetId: requested.templateSetId, reps });
  }

  function selectRpe(rpe: RpePickerValue | null) {
    const requested = getRequestedPanel();

    if (requested)
      actions.updateSet({
        templateSetId: requested.templateSetId,
        values: { rpe },
      });
  }

  function selectSetType(type: SetType) {
    const requested = getRequestedPanel();

    if (requested)
      actions.updateSet({
        templateSetId: requested.templateSetId,
        values: { type },
      });
  }

  return {
    activeSet,
    activeExercise,
    panel: controller.panel,
    repsDraft:
      controller.panel?.type === "repsKeypad"
        ? controller.panel.draft
        : undefined,
    openSetEditor,
    closeSetEditor,
    pressRepsKey,
    selectRpe,
    selectSetType,
    savePendingKeypadUpdate,
    cancelPendingUpdates,
  };
}
