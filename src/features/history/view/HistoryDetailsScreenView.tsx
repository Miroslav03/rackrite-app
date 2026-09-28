import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useRouter } from "expo-router";

import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { HistoryWorkoutDetails } from "@/domain/history/history.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";

import { ErrorNotifier } from "@/shared/components/feedback/ErrorNotifier/ErrorNotifier";
import { getActiveWorkoutOperationErrorMessage } from "@/shared/components/feedback/ErrorNotifier/utils";
import { Screen } from "@/shared/components/layout/Screen";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors, spacing } from "@/shared/theme/tokens";

import { useRepeatWorkoutController } from "../controller/useRepeatWorkoutController";

import { HistoryExerciseCard } from "./components/HistoryExerciseCard";
import { RepeatWorkoutModal } from "./components/RepeatWorkoutModal";
import { createHistoryDetailsViewModel } from "./historyDetails.viewModel";

type HistoryDetailsScreenViewProps = {
  workout: HistoryWorkoutDetails;
  session: WorkoutSessionController;
};

export function HistoryDetailsScreenView({
  workout: details,
  session,
}: HistoryDetailsScreenViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const openActiveWorkout = useCallback(
    () => router.replace("/workout"),
    [router],
  );

  const repeat = useRepeatWorkoutController(
    session,
    openActiveWorkout,
    isFocused,
  );

  const repeatPending = repeat.pendingWorkoutId !== null;

  const workout = useMemo(
    () => createHistoryDetailsViewModel(details),
    [details],
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
        testID="history-details-list"
        data={workout.exercises}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => <HistoryExerciseCard exercise={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: spacing.xl,
          paddingTop: spacing.xl,
        }}
        ItemSeparatorComponent={<View className="h-lg" />}
        ListHeaderComponent={
          <View className="gap-xl pb-xl">
            <View className="gap-sm">
              <AppText variant="title">{workout.name}</AppText>
              <View className="flex-row flex-wrap items-center gap-sm">
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primarySoft}
                />
                <AppText className="text-sm font-semibold text-foreground">
                  {workout.date}
                </AppText>
                <AppText>·</AppText>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.primarySoft}
                />
                <AppText className="text-sm font-semibold text-foreground">
                  {workout.duration}
                </AppText>
              </View>
            </View>
            <View className="flex-row gap-sm">
              <Metric
                label="Total Volume"
                value={workout.totalVolume}
                unit="kg"
              />
              <Metric label="Total Sets" value={workout.totalSets} />
              <Metric label="Avg. RPE" value={workout.averageRpe} />
            </View>
          </View>
        }
      />
      <View
        className="bg-transparent"
        style={{ paddingBottom: insets.bottom + spacing.lg }}
      >
        <Button
          title={repeatPending ? "Repeating..." : "Repeat Workout"}
          accessibilityRole="button"
          accessibilityState={{
            disabled: repeat.disabled,
            busy: repeatPending,
          }}
          disabled={repeat.disabled || details.totalSets === 0}
          onPress={() => repeat.requestRepeat(details.id)}
          leftIcon={
            repeatPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="refresh" size={20} color="white" />
            )
          }
        />
      </View>
      <RepeatWorkoutModal
        overlay={repeat.overlay}
        pending={repeatPending}
        onConfirm={repeat.confirm}
        onClose={repeat.close}
      />
    </Screen>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <SurfaceCard
      className="flex-1 bg-surfaceLow border-l-2"
      accent="primary"
      contentClassName="p-md gap-xs"
    >
      <AppText
        variant="subtitle"
        className="text-xs font-extrabold uppercase tracking-wide"
      >
        {label}
      </AppText>
      <AppText className="text-xl font-extrabold text-foreground">
        {value}
        {unit ? (
          <AppText className="text-[10px] uppercase"> {unit}</AppText>
        ) : null}
      </AppText>
    </SurfaceCard>
  );
}
