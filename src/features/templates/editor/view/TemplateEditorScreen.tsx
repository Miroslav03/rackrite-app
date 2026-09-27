import { Ionicons } from "@expo/vector-icons";

import { useIsFocused, usePreventRemove } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, FlatList, Platform } from "react-native";

import type { Exercise } from "@/domain/exercises/exercise.types";
import { getTemplateExerciseById } from "@/domain/templates/editor/templates.selectors";
import type {
  TemplateExerciseAggregate,
  TemplateExerciseId,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { ExercisePickerSheet } from "@/features/exercises/view/components/ExercisePickerSheet";

import {
  ExerciseOptionsSheet,
  type ExerciseOption,
} from "@/shared/components/exercise-editor/ExerciseOptionsSheet";
import { ExerciseOrderEditor } from "@/shared/components/exercise-editor/ExerciseOrderEditor/ExerciseOrderEditor";
import { ErrorNotifier } from "@/shared/components/feedback/ErrorNotifier/ErrorNotifier";
import { getTemplateEditorOperationErrorMessage } from "@/shared/components/feedback/ErrorNotifier/utils";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { ConfirmationModal as ConfirmationModalView } from "@/shared/components/ui/ConfirmationModal";
import { DangerModal as DangerModalView } from "@/shared/components/ui/DangerModal";
import { useScrollVisibility } from "@/shared/context/ScrollVisibilityContext";
import { isOperationPending } from "@/shared/state/operationState";
import { colors, spacing } from "@/shared/theme/tokens";

import type { TemplateSessionState } from "../session/templatesSession.types";
import type { TemplateSessionController } from "../session/useTemplateSessionController";

import { TemplateEditorDock } from "./TemplateEditorDock/TemplateEditorDock";
import { useTemplateEditorDockEditor } from "./TemplateEditorDock/useTemplateEditorDockEditor";
import { TemplateExerciseSection } from "./components/TemplateExerciseSection";
import {
  getAddExerciseOperation,
  getExercisePickerExclusions,
  getModalContent,
  getModalOperation,
  TEMPLATE_EDITOR_VIEW,
} from "./templateEditor.viewState.utils";

export type TemplateEditorScreenProps = {
  state: Extract<TemplateSessionState, { status: "create" | "edit" }>;
  actions: Pick<
    TemplateSessionController,
    | "discardTemplate"
    | "createTemplate"
    | "addExercise"
    | "removeExercise"
    | "addSet"
    | "updateExerciseOrder"
    | "updateSet"
    | "removeSet"
    | "selectSet"
    | "dismissOperationError"
  >;
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
  const [dockHeight, setDockHeight] = useState(0);

  const listRef = useRef<FlatList<TemplateExerciseAggregate>>(null);
  const scrollOffsetRef = useRef(0);

  const isFocused = useIsFocused();
  const { registerScroller, ensureVisible } = useScrollVisibility();

  const template = state.activeTemplate;
  const editor = useTemplateEditorDockEditor(
    template,
    state.activeSetId,
    actions,
  );

  const pending = isOperationPending(state.operation);
  const modalContent = getModalContent(activeOverlay, template);
  const exclusions = getExercisePickerExclusions(template);
  const canCreate = state.status === "create" && template.exercises.length > 0;

  const optionsExercise =
    activeOverlay.type === "exerciseOptions"
      ? getTemplateExerciseById(template, activeOverlay.templateExerciseId)
      : undefined;

  const view = TEMPLATE_EDITOR_VIEW[state.status];

  const dockOpen =
    editor.panel !== null &&
    editor.activeSet !== undefined &&
    editor.activeExercise !== undefined;

  const closeOverlay = useCallback(() => {
    if (!pending) setActiveOverlay(NO_ACTIVE_OVERLAY);
  }, [pending]);

  const openDiscardTemplateConfirmation = () => {
    if (pending) return;

    setActiveOverlay({
      type: "dangerModal",
      confirmation: { action: "discardTemplate" },
    });
  };

  const handleBack = useCallback(() => {
    if (pending) return;

    if (activeOverlay.type !== "none") {
      closeOverlay();
    } else if (dockOpen) {
      void editor.closeSetEditor();
    } else {
      openDiscardTemplateConfirmation();
    }
  }, [
    activeOverlay.type,
    closeOverlay,
    dockOpen,
    editor.closeSetEditor,
    pending,
  ]);

  usePreventRemove(true, handleBack);

  useEffect(() => {
    if (!isFocused || Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [handleBack, isFocused]);

  useEffect(
    () =>
      registerScroller((delta) => {
        listRef.current?.scrollToOffset({
          offset: scrollOffsetRef.current + delta,
          animated: true,
        });
      }),
    [registerScroller],
  );

  async function openExercisePicker() {
    if (pending) return;

    if (await editor.closeSetEditor()) {
      setActiveOverlay({ type: "exercisePicker" });
    }
  }

  function handleExerciseSelected(exercise: Exercise) {
    if (actions.addExercise({ exercise }).success) closeOverlay();
  }

  async function openExerciseOptions(templateExerciseId: TemplateExerciseId) {
    if (pending || !(await editor.closeSetEditor())) return;

    setActiveOverlay({ type: "exerciseOptions", templateExerciseId });
  }

  function handleExerciseOptionSelected(option: ExerciseOption) {
    if (pending || activeOverlay.type !== "exerciseOptions") return;

    switch (option) {
      case "removeExercise":
        setActiveOverlay({
          type: "dangerModal",
          confirmation: {
            action: "removeExercise",
            templateExerciseId: activeOverlay.templateExerciseId,
          },
        });
        return;
    }
  }

  async function openExerciseOrderEditor(
    templateExerciseId: TemplateExerciseId,
  ) {
    if (pending || template.exercises.length < 2) return;

    if (!(await editor.closeSetEditor())) return;

    setActiveOverlay({ type: "exerciseOrderEditor", templateExerciseId });
  }

  async function handleExerciseOrderChange(
    templateExerciseId: TemplateExerciseId,
    orderIndex: number,
  ) {
    const result = actions.updateExerciseOrder({
      templateExerciseId,
      orderIndex,
    });

    return result.success;
  }

  async function handleAddSet(templateExerciseId: TemplateExerciseId) {
    if (pending || !(await editor.savePendingKeypadUpdate())) return;

    actions.addSet({ templateExerciseId });
  }

  function handleRemoveExercise(templateExerciseId: TemplateExerciseId) {
    if (actions.removeExercise({ templateExerciseId }).success) closeOverlay();
  }

  async function openCreateTemplateConfirmation() {
    if (pending || !canCreate || !(await editor.closeSetEditor())) return;

    setActiveOverlay({
      type: "confirmationModal",
      confirmation: { action: "createTemplate" },
    });
  }

  async function openRemoveSetConfirmation() {
    if (!editor.activeSet || !(await editor.savePendingKeypadUpdate())) return;

    setActiveOverlay({
      type: "dangerModal",
      confirmation: { action: "removeSet", templateSetId: editor.activeSet.id },
    });
  }

  function handleDiscardTemplate() {
    editor.cancelPendingUpdates();
    actions.discardTemplate();
  }

  function handleRemoveSet(templateSetId: TemplateSetId) {
    const result = actions.removeSet({ templateSetId });

    if (!result.success) {
      return;
    }

    actions.selectSet(null);
    closeOverlay();
  }

  function handleModalAction() {
    if (pending) return;

    switch (activeOverlay.type) {
      case "dangerModal":
        switch (activeOverlay.confirmation.action) {
          case "discardTemplate":
            handleDiscardTemplate();
            return;

          case "removeExercise":
            handleRemoveExercise(activeOverlay.confirmation.templateExerciseId);
            return;

          case "removeSet":
            handleRemoveSet(activeOverlay.confirmation.templateSetId);
            return;
        }

      case "confirmationModal":
        switch (activeOverlay.confirmation.action) {
          case "createTemplate":
            if (canCreate) void actions.createTemplate();
            return;

          case "editTemplate":
            return;
        }
    }
  }

  return (
    <>
      <Screen scroll={false} showBackButton className="pt-0">
        <FlatList
          ref={listRef}
          className="flex-1"
          data={template.exercises}
          extraData={{
            activeSetId: state.activeSetId,
            panel: editor.panel,
            pending,
          }}
          keyExtractor={({ templateExercise }) => templateExercise.id}
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          onContentSizeChange={ensureVisible}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: spacing.xl,
            paddingBottom: dockOpen ? dockHeight : 0,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TemplateExerciseSection
              exerciseAggregate={item}
              activeSetId={dockOpen ? state.activeSetId : null}
              activeField={editor.panel?.type}
              repsDraft={editor.repsDraft}
              disabled={pending}
              canReorder={template.exercises.length > 1}
              onOpenOptions={openExerciseOptions}
              onOpenOrderEditor={openExerciseOrderEditor}
              onAddSet={handleAddSet}
              onOpenEditor={editor.openSetEditor}
            />
          )}
          ListHeaderComponent={
            <ScreenHeader title={view.screenTitle} subtitle="Templates" />
          }
          ListHeaderComponentStyle={
            template.exercises.length > 0
              ? { marginBottom: spacing.sm }
              : undefined
          }
          ListEmptyComponent={
            <ScreenSection>
              <AppText variant="subtitle">
                Add an exercise to begin your template.
              </AppText>
            </ScreenSection>
          }
          ListFooterComponent={
            <ScreenSection className="relative z-30 mt-0 pt-8 pb-4">
              <Button
                title="Add Exercise"
                variant="ghost"
                intent="neutral"
                size="md"
                accessibilityRole="button"
                disabled={pending}
                dimWhenDisabled={false}
                leftIcon={
                  <Ionicons
                    name="barbell-outline"
                    size={18}
                    color={colors.foreground}
                  />
                }
                onPress={openExercisePicker}
              />
              <Button
                title={view.finishButtonTitle}
                variant="ghost"
                intent="primary"
                size="lg"
                disabled={pending || !canCreate}
                dimWhenDisabled={true}
                accessibilityRole="button"
                leftIcon={
                  <Ionicons
                    name="checkmark-outline"
                    size={18}
                    color={colors.primarySoft}
                  />
                }
                textClassName="color-primarySoft"
                onPress={openCreateTemplateConfirmation}
              />
              <Button
                title={view.discardButtonTitle}
                variant="ghost"
                intent="danger"
                size="md"
                disabled={pending}
                dimWhenDisabled={false}
                accessibilityRole="button"
                leftIcon={
                  <Ionicons
                    name="close-outline"
                    size={18}
                    color={colors.error}
                  />
                }
                onPress={openDiscardTemplateConfirmation}
              />
            </ScreenSection>
          }
          ListFooterComponentStyle={{ marginTop: "auto" }}
        />
      </Screen>

      {editor.panel && editor.activeSet && editor.activeExercise ? (
        <TemplateEditorDock
          exerciseName={editor.activeExercise.exercise.name}
          activeSet={editor.activeSet}
          setCount={editor.activeExercise.sets.length}
          panel={editor.panel}
          disabled={pending}
          onPressRepsKey={editor.pressRepsKey}
          onSelectRpe={editor.selectRpe}
          onSelectSetType={editor.selectSetType}
          onClose={() => {
            void editor.closeSetEditor();
          }}
          onDelete={() => {
            void openRemoveSetConfirmation();
          }}
          onHeightChange={setDockHeight}
        />
      ) : null}

      <ErrorNotifier
        operation={state.operation}
        isFocused={isFocused}
        onErrorDismissed={actions.dismissOperationError}
        getErrorMessage={getTemplateEditorOperationErrorMessage}
      />

      <ExercisePickerSheet
        open={activeOverlay.type === "exercisePicker"}
        excludedExerciseIds={exclusions.excludedExerciseIds}
        selectionOperation={getAddExerciseOperation(
          activeOverlay,
          state.operation,
        )}
        onSelect={handleExerciseSelected}
        excludedKinds={exclusions.excludedKinds}
        onClose={closeOverlay}
      />

      {optionsExercise && (
        <ExerciseOptionsSheet
          exerciseName={optionsExercise.exercise.name}
          onOptionSelect={handleExerciseOptionSelected}
          onClose={closeOverlay}
        />
      )}

      {activeOverlay.type === "exerciseOrderEditor" && (
        <ExerciseOrderEditor
          exercises={template.exercises.map(
            ({ templateExercise, exercise }) => ({
              id: templateExercise.id,
              name: exercise.name,
              kind: exercise.kind,
            }),
          )}
          initialExerciseId={activeOverlay.templateExerciseId}
          disabled={pending}
          onMove={handleExerciseOrderChange}
          onClose={closeOverlay}
        />
      )}

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

      {activeOverlay.type === "confirmationModal" && modalContent !== null && (
        <ConfirmationModalView
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
