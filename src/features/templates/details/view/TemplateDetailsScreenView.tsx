import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";

import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TemplateDetails } from "@/domain/templates/details/templates.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import { isStartWorkoutFromTemplatePending } from "@/features/workout/session/workoutSession.selectors";

import { ErrorNotifier } from "@/shared/components/feedback/ErrorNotifier/ErrorNotifier";
import { getActiveWorkoutOperationErrorMessage } from "@/shared/components/feedback/ErrorNotifier/utils";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { DangerModal as DangerModalView } from "@/shared/components/ui/DangerModal";
import { DescriptionCard } from "@/shared/components/ui/DescriptionCard";
import { ExerciseDetailsCard } from "@/shared/components/ui/ExerciseDetailsCard";
import { Metric } from "@/shared/components/ui/Metric";
import { isOperationPending } from "@/shared/state/operationState";
import { colors, spacing } from "@/shared/theme/tokens";

import { TemplateOptionsSheet } from "./components/TemplateOptionsSheet";
import { createTemplateDetailsViewModel } from "./templateDetails.viewState.utils";
import { useTemplateDetailsScreenOverlay } from "./useTemplateDetailsScreenOverlay";

type TemplateDetailsScreenViewProps = {
  template: TemplateDetails;
  dateReference: number;
  session: Pick<
    WorkoutSessionController,
    "state" | "startWorkoutFromTemplate" | "dismissOperationError"
  >;
};

export function TemplateDetailsScreenView({
  template: details,
  dateReference,
  session,
}: TemplateDetailsScreenViewProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const {
    activeOverlay,
    modalContent,
    modalOperation,
    closeOverlay,
    handleModalAction,
    handleRequestStartWorkout,
    openTemplateDetailsOptions,
    handleTemplateDetailsOptionsSelected,
  } = useTemplateDetailsScreenOverlay({
    template: details,
    workoutSession: session,
  });

  const template = useMemo(
    () => createTemplateDetailsViewModel(details, dateReference),
    [details, dateReference],
  );

  const operation =
    session.state.status === "active" ||
    session.state.status === "noActiveWorkout"
      ? session.state.operation
      : null;

  const startPending =
    operation !== null && isStartWorkoutFromTemplatePending(operation);

  const startDisabled =
    !isFocused ||
    operation === null ||
    isOperationPending(operation) ||
    details.totalSets === 0;

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
      {operation && (
        <ErrorNotifier
          operation={operation}
          isFocused={isFocused}
          onErrorDismissed={session.dismissOperationError}
          getErrorMessage={getActiveWorkoutOperationErrorMessage}
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
