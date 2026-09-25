import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { DangerModal as DangerModalView } from "@/shared/components/ui/DangerModal";

import {
  TemplateExerciseId,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";
import type { TemplateSessionState } from "../session/templatesSession.types";
import {
  getModalContent,
  getModalOperation,
} from "./templateEditor.viewState.utils";

type CommonTemplateEditorActions = {
  discardTemplate: () => void;
};

type CreateTemplateEditorActions = {
  /*   createTemplate: () => Promise<void>; */
};

type EditTemplateEditorActions = { /*   editTemplate: () => Promise<void>; */ };

type CreateState = Extract<TemplateSessionState, { status: "create" }>;
type EditState = Extract<TemplateSessionState, { status: "edit" }>;

type TemplateEditorScreenProps =
  | {
      state: CreateState;
      actions: CommonTemplateEditorActions & CreateTemplateEditorActions;
    }
  | {
      state: EditState;
      actions: CommonTemplateEditorActions & EditTemplateEditorActions;
    };

export type DangerModal =
  | { action: "discardTemplate" }
  | { action: "removeExercise"; templateExerciseId: TemplateExerciseId }
  | { action: "removeSet"; templateSetId: TemplateSetId };

export type ConfirmationModal =
  | {
      action: "createTemplate";
    }
  | {
      action: "editTemplate";
    };

export type TemplateEditorOverlay =
  | { type: "none" }
  | { type: "exercisePicker" }
  | { type: "exerciseOptions"; templateExerciseId: TemplateExerciseId }
  | { type: "exerciseOrderEditor"; templateExerciseId: TemplateExerciseId }
  | { type: "confirmationModal"; confirmation: ConfirmationModal }
  | { type: "dangerModal"; confirmation: DangerModal };

const NO_ACTIVE_OVERLAY: TemplateEditorOverlay = { type: "none" };

export function TemplateEditorScreen({
  state,
  actions,
}: TemplateEditorScreenProps) {
  const [activeOverlay, setActiveOverlay] =
    useState<TemplateEditorOverlay>(NO_ACTIVE_OVERLAY);

  const modalContent = getModalContent(activeOverlay);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setActiveOverlay({
          type: "dangerModal",
          confirmation: { action: "discardTemplate" },
        });
        return true;
      },
    );

    return () => subscription.remove();
  }, [setActiveOverlay]);

  function closeOverlay() {
    setActiveOverlay(NO_ACTIVE_OVERLAY);
  }

  function handleDiscardTemplate() {
    actions.discardTemplate();
  }

  function handleModalAction() {
    switch (activeOverlay.type) {
      case "dangerModal":
        switch (activeOverlay.confirmation.action) {
          case "discardTemplate":
            void handleDiscardTemplate();
            return;
        }
    }
  }

  return (
    <>
      <Screen scroll={false} showBackButton>
        <ScreenHeader
          title={
            state.status === "create" ? "Create Template" : "Edit Template"
          }
          subtitle="Templates"
        />
      </Screen>

      {activeOverlay.type === "dangerModal" && modalContent !== null && (
        <DangerModalView
          open
          title={modalContent.title}
          description={modalContent.description}
          confirmLabel={modalContent.confirmLabel}
          operation={getModalOperation(activeOverlay, state.operation)}
          onConfirm={handleModalAction}
          onClose={closeOverlay}
        />
      )}
    </>
  );
}
