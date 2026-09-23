import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useRouter } from "expo-router";

import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { HistoryWorkoutDetails } from "@/domain/history/history.types";

import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import { ActiveWorkoutOperationErrorNotifier } from "@/features/workout/view/components/ActiveWorkoutOperationErrorNotifier";

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
        <ActiveWorkoutOperationErrorNotifier
          operation={session.state.operation}
          isFocused={isFocused}
          onErrorDismissed={session.dismissOperationError}
        />
      )}
      <FlatList
        testID="history-details-list"
        data={workout.exercises}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => <HistoryExerciseCard exercise={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ItemSeparatorComponent={<View className="h-xl" />}
        ListHeaderComponent={
          <View className="gap-xl pb-xl pt-sm">
            <View className="gap-sm">
              <AppText variant="logo" className="text-3xl uppercase">
                {workout.name}
              </AppText>
              <View className="flex-row flex-wrap items-center gap-sm">
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.primarySoft}
                />
                <AppText className="text-xs font-semibold text-foreground">
                  {workout.date}
                </AppText>
                <AppText>·</AppText>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.primarySoft}
                />
                <AppText className="text-xs font-semibold text-foreground">
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
        className="bg-background pt-md"
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
      className="flex-1 bg-surfaceLow"
      contentClassName="p-md gap-sm"
    >
      <AppText className="text-[10px] font-bold uppercase tracking-wide">
        {label}
      </AppText>
      <AppText
        className="text-2xl font-extrabold text-foreground"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
        {unit ? (
          <AppText className="text-[10px] uppercase"> {unit}</AppText>
        ) : null}
      </AppText>
    </SurfaceCard>
  );
}
