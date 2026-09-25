import type { Exercise } from "@/domain/exercises/exercise.types";
import type {
  TemplateExerciseAggregate,
  TemplateExerciseId,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";
import { ExercisePickerSheet } from "@/features/exercises/view/components/ExercisePickerSheet";
import { ErrorNotifier } from "@/shared/components/feedback/ErrorNotifier/ErrorNotifier";
import { getTemplateEditorOperationErrorMessage } from "@/shared/components/feedback/ErrorNotifier/utils";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { DangerModal as DangerModalView } from "@/shared/components/ui/DangerModal";
import { useScrollVisibility } from "@/shared/context/ScrollVisibilityContext";
import { colors, spacing } from "@/shared/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, usePreventRemove } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, FlatList, Platform } from "react-native";
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
} from "./templateEditor.viewState.utils";

type TemplateEditorScreenProps = {
  state: Extract<TemplateSessionState, { status: "create" | "edit" }>;
  actions: Pick<
    TemplateSessionController,
    | "discardTemplate"
    | "addExercise"
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

  const pending = state.operation.status === "pending";
  const modalContent = getModalContent(activeOverlay, template);
  const exclusions = getExercisePickerExclusions(template);

  const dockOpen =
    editor.panel !== null &&
    editor.activeSet !== undefined &&
    editor.activeExercise !== undefined;

  const closeOverlay = useCallback(
    () => setActiveOverlay(NO_ACTIVE_OVERLAY),
    [],
  );

  const handleBack = useCallback(() => {
    if (pending) return;

    if (activeOverlay.type !== "none") {
      closeOverlay();
    } else if (dockOpen) {
      void editor.closeSetEditor();
    } else {
      setActiveOverlay({
        type: "dangerModal",
        confirmation: { action: "discardTemplate" },
      });
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
    if (await editor.closeSetEditor())
      setActiveOverlay({ type: "exercisePicker" });
  }

  function handleExerciseSelected(exercise: Exercise) {
    if (actions.addExercise({ exercise }).success) closeOverlay();
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
    if (activeOverlay.type !== "dangerModal") return;

    switch (activeOverlay.confirmation.action) {
      case "discardTemplate":
        handleDiscardTemplate();
        return;

      case "removeSet":
        handleRemoveSet(activeOverlay.confirmation.templateSetId);
        return;
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
              onOpenEditor={editor.openSetEditor}
            />
          )}
          ListHeaderComponent={
            <ScreenHeader
              title={
                state.status === "create" ? "Create Template" : "Edit Template"
              }
              subtitle="Templates"
            />
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
                onPress={() => {
                  void openExercisePicker();
                }}
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
