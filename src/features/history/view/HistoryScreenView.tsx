import { useIsFocused, useRouter } from "expo-router";

import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type ListRenderItemInfo,
} from "react-native";

import type { HistoryWorkoutSummary } from "@/domain/history/history.types";
import type { WorkoutId } from "@/domain/workout/workout.types";

import type { HistoryState } from "@/features/history/controller/history.types";
import type { WorkoutSessionController } from "@/features/workout/session/useWorkoutSessionController";
import { ActiveWorkoutOperationErrorNotifier } from "@/features/workout/view/components/ActiveWorkoutOperationErrorNotifier";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors, spacing } from "@/shared/theme/tokens";

import { useRepeatWorkoutController } from "../controller/useRepeatWorkoutController";

import { HistoryErrorNotice } from "./components/HistoryErrorNotice";
import { HistoryWorkoutCard } from "./components/HistoryWorkoutCard";
import { RepeatWorkoutModal } from "./components/RepeatWorkoutModal";

type HistoryScreenViewProps = {
  state: Extract<HistoryState, { status: "ready" }>;
  session: WorkoutSessionController;
  dateReference: number;
  onRefresh: () => void;
  onLoadNextPage: () => void;
  onRetryNextPage: () => void;
};

export function HistoryScreenView({
  state,
  session,
  dateReference,
  onRefresh,
  onLoadNextPage,
  onRetryNextPage,
}: HistoryScreenViewProps) {
  const router = useRouter();
  const isFocused = useIsFocused();

  const listRef = useRef<FlatList<HistoryWorkoutSummary>>(null);

  const openActiveWorkout = useCallback(
    () => router.push("/workout"),
    [router],
  );

  const openWorkout = useCallback(
    (workoutId: WorkoutId) =>
      router.push({
        pathname: "/history/[workoutId]",
        params: { workoutId },
      }),
    [router],
  );

  const repeat = useRepeatWorkoutController(
    session,
    openActiveWorkout,
    isFocused,
  );
  const { requestRepeat, disabled: repeatDisabled, pendingWorkoutId } = repeat;

  const renderWorkout = useCallback(
    ({ item }: ListRenderItemInfo<HistoryWorkoutSummary>) => (
      <HistoryWorkoutCard
        workout={item}
        dateReference={dateReference}
        onOpen={openWorkout}
        onRepeat={requestRepeat}
        repeatDisabled={repeatDisabled}
        repeatPending={pendingWorkoutId === item.id}
      />
    ),
    [
      dateReference,
      openWorkout,
      requestRepeat,
      repeatDisabled,
      pendingWorkoutId,
    ],
  );

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [state.revision]);

  return (
    <Screen scroll={false} className="pt-0 pb-0">
      {(session.state.status === "active" ||
        session.state.status === "noActiveWorkout") && (
        <ActiveWorkoutOperationErrorNotifier
          operation={session.state.operation}
          isFocused={isFocused}
          onErrorDismissed={session.dismissOperationError}
        />
      )}
      <FlatList
        ref={listRef}
        testID="history-list"
        className="flex-1"
        data={state.items}
        extraData={dateReference}
        keyExtractor={(item: HistoryWorkoutSummary) => item.id}
        renderItem={renderWorkout}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        onEndReachedThreshold={0.5}
        onEndReached={onLoadNextPage}
        refreshing={state.refresh.status === "pending"}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
        }}
        ItemSeparatorComponent={<View className="h-lg" />}
        ListHeaderComponent={
          <View className="pb-xl">
            <ScreenHeader
              title="History"
              subtitle="Logbook"
              rightAccessory={
                <HeaderMetric
                  value={String(state.totalCount)}
                  label="Completed Workouts"
                />
              }
            />
            {state.refresh.status === "error" ? (
              <HistoryErrorNotice
                message="Couldn't refresh your history. Your loaded workouts are still available."
                error={state.refresh.error}
                onRetry={onRefresh}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center">
            <View>
              <AppText className="text-center text-xl font-bold text-foreground">
                No workouts yet
              </AppText>

              <AppText className="text-center">
                Finish your first session to build your history.
              </AppText>
            </View>

            <View className="absolute bottom-0 left-0 right-0">
              <Button
                title="Go to Start"
                accessibilityRole="button"
                onPress={() => router.navigate("/")}
              />
            </View>
          </View>
        }
        ListFooterComponent={
          state.pagination.status === "pending" ? (
            <ActivityIndicator
              accessibilityLabel="Loading older workouts"
              color={colors.primarySoft}
              style={{ padding: spacing.lg }}
            />
          ) : state.pagination.status === "error" ? (
            <HistoryErrorNotice
              message="Couldn't load older workouts."
              error={state.pagination.error}
              onRetry={onRetryNextPage}
            />
          ) : null
        }
      />
      <RepeatWorkoutModal
        overlay={repeat.overlay}
        pending={pendingWorkoutId !== null}
        onConfirm={repeat.confirm}
        onClose={repeat.close}
      />
    </Screen>
  );
}
