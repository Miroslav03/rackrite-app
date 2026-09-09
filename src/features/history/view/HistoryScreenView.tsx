import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type ListRenderItemInfo,
} from "react-native";

import type { HistoryWorkoutSummary } from "@/domain/history/history.types";

import type { HistoryState } from "@/features/history/controller/history.types";

import { HeaderMetric } from "@/shared/components/layout/HeaderMetric";
import { Screen } from "@/shared/components/layout/Screen";
import { ScreenHeader } from "@/shared/components/layout/ScreenHeader";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors, spacing } from "@/shared/theme/tokens";

import { HistoryErrorNotice } from "./components/HistoryErrorNotice";
import { HistoryWorkoutCard } from "./components/HistoryWorkoutCard";

type HistoryScreenViewProps = {
  state: Extract<HistoryState, { status: "ready" }>;
  dateReference: number;
  onRefresh: () => void;
  onLoadNextPage: () => void;
  onRetryNextPage: () => void;
  onOpenStart: () => void;
};

export function HistoryScreenView({
  state,
  dateReference,
  onRefresh,
  onLoadNextPage,
  onRetryNextPage,
  onOpenStart,
}: HistoryScreenViewProps) {
  const listRef = useRef<FlatList<HistoryWorkoutSummary>>(null);

  const renderWorkout = useCallback(
    ({ item }: ListRenderItemInfo<HistoryWorkoutSummary>) => (
      <HistoryWorkoutCard workout={item} dateReference={dateReference} />
    ),
    [dateReference],
  );

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [state.revision]);

  return (
    <Screen scroll={false} className="pt-0">
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
          <View className="flex-1 justify-center gap-lg py-2xl">
            <AppText className="text-center text-xl font-bold text-foreground">
              No workouts yet
            </AppText>
            <AppText className="text-center">
              Finish your first session to build your history.
            </AppText>
            <Button
              title="Go to Start"
              accessibilityRole="button"
              onPress={onOpenStart}
            />
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
    </Screen>
  );
}
