import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";

import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TemplateDetails } from "@/domain/templates/details/templates.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";

import { ErrorNotifier } from "@/shared/components/feedback/ErrorNotifier/ErrorNotifier";
import { getTemplateDetailsOperationErrorMessage } from "@/shared/components/feedback/ErrorNotifier/utils";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { DangerModal as DangerModalView } from "@/shared/components/ui/DangerModal";
import { DescriptionCard } from "@/shared/components/ui/DescriptionCard";
import { ExerciseDetailsCard } from "@/shared/components/ui/ExerciseDetailsCard";
import { Metric } from "@/shared/components/ui/Metric";
import { colors, spacing } from "@/shared/theme/tokens";

import type { TemplateDetailsController } from "../controller/useTemplateDetailsController";

import { TemplateOptionsSheet } from "./components/TemplateOptionsSheet";
import { createTemplateDetailsViewModel } from "./templateDetails.viewState.utils";
import { useTemplateDetailsScreenOverlay } from "./useTemplateDetailsScreenOverlay";

type TemplateDetailsScreenViewProps = {
  template: TemplateDetails;
  dateReference: number;
  templateSession: Pick<
    TemplateDetailsController,
    "state" | "deleteTemplate" | "dismissOperationError"
  >;
  workoutSession: Pick<
    WorkoutSessionController,
    "state" | "startWorkoutFromTemplate" | "dismissOperationError"
  >;
};

export function TemplateDetailsScreenView({
  template: details,
  dateReference,
  workoutSession,
  templateSession,
}: TemplateDetailsScreenViewProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const {
    activeOverlay,
    modalContent,
    modalOperation,
    canStartWorkout,
    startPending,
    errorOperation,
    closeOverlay,
    handleModalAction,
    handleRequestStartWorkout,
    openTemplateDetailsOptions,
    handleTemplateDetailsOptionsSelected,
  } = useTemplateDetailsScreenOverlay({
    template: details,
    workoutSession,
    templateSession,
  });

  const template = useMemo(
    () => createTemplateDetailsViewModel(details, dateReference),
    [details, dateReference],
  );

  const startDisabled =
    !isFocused || !canStartWorkout || details.totalSets === 0;

  const dismissOperationError =
    errorOperation?.operation.type === "deleteTemplate"
      ? templateSession.dismissOperationError
      : workoutSession.dismissOperationError;

  return (
    <Screen
      scroll={false}
      showBackButton
      className="pt-0 pb-0"
      headerRightAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${template.name}`}
          onPress={openTemplateDetailsOptions}
          hitSlop={12}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
        </Pressable>
      }
    >
      {errorOperation && (
        <ErrorNotifier
          operation={errorOperation}
          isFocused={isFocused}
          onErrorDismissed={dismissOperationError}
          getErrorMessage={getTemplateDetailsOperationErrorMessage}
        />
      )}
      <FlatList
        testID="template-details-list"
        data={template.exercises}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => (
          <ExerciseDetailsCard
            exercise={item}
            showWeight={false}
            setTestIdPrefix="template-set"
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.xl,
          paddingTop: spacing.xl,
        }}
        ItemSeparatorComponent={<View className="h-lg" />}
        ListHeaderComponent={
          <View className="gap-xl pb-xl">
            <View className="gap-sm">
              <AppText variant="title">{template.name}</AppText>
              <View className="flex-row items-center gap-sm">
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.primarySoft}
                />
                <AppText className="text-sm font-semibold text-foreground">
                  Last performed: {template.lastPerformed}
                </AppText>
              </View>
            </View>
            <View className="flex-row gap-sm">
              <Metric label="Total Sets" value={template.totalSets} />
              <Metric label="Avg. RPE" value={template.averageRpe} />
            </View>
            <DescriptionCard mode="view" description={template.description} />
          </View>
        }
      />
      <View
        className="bg-transparent"
        style={{ paddingBottom: insets.bottom + spacing.lg }}
      >
        <Button
          testID="start-template-workout"
          title={startPending ? "Starting..." : "Start Workout"}
          accessibilityRole="button"
          accessibilityState={{
            disabled: startDisabled,
            busy: startPending,
          }}
          disabled={startDisabled}
          onPress={() => handleRequestStartWorkout(details.id)}
          leftIcon={
            startPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="play" size={20} color="white" />
            )
          }
        />
      </View>

      {activeOverlay.type === "templateDetailsOptions" && (
        <TemplateOptionsSheet
          templateName={template.name}
          onOptionSelect={handleTemplateDetailsOptionsSelected}
          onClose={closeOverlay}
        />
      )}

      {activeOverlay.type === "dangerModal" && modalContent !== null && (
        <DangerModalView
          open
          title={modalContent.title}
          description={modalContent.description}
          confirmLabel={modalContent.confirmLabel}
          operation={modalOperation}
          onConfirm={handleModalAction}
          onClose={closeOverlay}
        />
      )}
    </Screen>
  );
}
