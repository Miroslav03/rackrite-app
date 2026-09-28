import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useRouter } from "expo-router";

import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { TemplateDetails } from "@/domain/templates/details/templates.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";

import { ErrorNotifier } from "@/shared/components/feedback/ErrorNotifier/ErrorNotifier";
import { getActiveWorkoutOperationErrorMessage } from "@/shared/components/feedback/ErrorNotifier/utils";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { ExerciseDetailsCard } from "@/shared/components/ui/ExerciseDetailsCard";
import { Metric } from "@/shared/components/ui/Metric";
import { spacing } from "@/shared/theme/tokens";

import { useStartTemplateWorkoutController } from "../controller/useStartTemplateWorkoutController";

import { StartTemplateWorkoutModal } from "./components/StartTemplateWorkoutModal";
import { createTemplateDetailsViewModel } from "./templateDetails.viewModel";

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const openActiveWorkout = useCallback(
    () => router.replace("/workout"),
    [router],
  );

  const start = useStartTemplateWorkoutController(
    session,
    openActiveWorkout,
    isFocused,
  );

  const startPending = start.pendingTemplateId !== null;

  const template = useMemo(
    () => createTemplateDetailsViewModel(details, dateReference),
    [details, dateReference],
  );

  return (
    <Screen scroll={false} showBackButton className="pt-0 pb-0">
      {(session.state.status === "active" ||
        session.state.status === "noActiveWorkout") && (
        <ErrorNotifier
          operation={session.state.operation}
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
              <AppText className="text-sm font-semibold text-foreground">
                Last performed: {template.lastPerformed}
              </AppText>
            </View>
            <View className="flex-row gap-sm">
              <Metric label="Total Sets" value={template.totalSets} />
              <Metric label="Avg. RPE" value={template.averageRpe} />
            </View>
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
            disabled: start.disabled || details.totalSets === 0,
            busy: startPending,
          }}
          disabled={start.disabled || details.totalSets === 0}
          onPress={() => start.requestStart(details.id)}
          leftIcon={
            startPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="play" size={20} color="white" />
            )
          }
        />
      </View>
      <StartTemplateWorkoutModal
        overlay={start.overlay}
        pending={startPending}
        onConfirm={start.confirm}
        onClose={start.close}
      />
    </Screen>
  );
}
