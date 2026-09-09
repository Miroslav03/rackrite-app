import { memo, useMemo } from "react";
import { View } from "react-native";

import type { HistoryWorkoutSummary } from "@/domain/history/history.types";

import { AppText } from "@/shared/components/ui/AppText";
import { Badge } from "@/shared/components/ui/Badge";
import { TemplateSurfaceCard } from "@/shared/components/ui/TemplateSurfaceCard";

import { createHistoryCardViewModel } from "../historyCard.viewModel";

type HistoryWorkoutCardProps = {
  workout: HistoryWorkoutSummary;
  dateReference: number;
};

export const HistoryWorkoutCard = memo(function HistoryWorkoutCard({
  workout,
  dateReference,
}: HistoryWorkoutCardProps) {
  const card = useMemo(
    () => createHistoryCardViewModel(workout, dateReference),
    [workout, dateReference],
  );

  console.log(card.workoutName);

  return (
    <TemplateSurfaceCard
      testID={`history-workout-${workout.id}`}
      surfaceAccent="primary"
      surfaceClassName="bg-surfaceLow rounded-2xl"
      contentClassName="px-sm pb-0 pt-sm"
      footerClassName="px-sm pt-sm pb-sm"
      dividerClassName="mx-lg bg-outline/20"
      footer={
        <View className="gap-xs">
          <View className="flex-row flex-wrap items-center gap-x-sm gap-y-xs">
            <AppText className="text-md font-bold uppercase tracking-wide">
              {card.relativeDay}
            </AppText>
            <AppText
              className="text-md font-bold uppercase tracking-wide"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {card.totalWeight}
            </AppText>
          </View>
          <AppText className="text-sm">{card.performedAt}</AppText>
        </View>
      }
    >
      <View className="gap-sm pb-md">
        <View className="flex-row items-center justify-between gap-x-sm gap-y-xs">
          <AppText variant="logo" className="flex-1 text-2xl tracking-wide">
            {card.workoutName}
          </AppText>
          <AppText
            className="text-sm font-bold uppercase tracking-wider"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {card.duration}
          </AppText>
        </View>
        {card.liftBadges.length > 0 ? (
          <View className="flex-row flex-wrap gap-xs">
            {card.liftBadges.map(({ family, label }) => (
              <Badge key={family} label={label.toUpperCase()} />
            ))}
          </View>
        ) : null}
      </View>

      {card.exercises.map((exercise) => (
        <View
          key={exercise.id}
          className="gap-sm border-t border-outline/20 py-md"
        >
          <View className="flex-row items-baseline justify-between gap-sm">
            <View className="flex-row items-baseline gap-sm">
              <AppText className="flex-shrink text-md font-bold text-foreground">
                {exercise.name}
              </AppText>

              <AppText className="text-xs">{exercise.totalSets}</AppText>
            </View>

            <AppText className="text-xs">{exercise.topSet}</AppText>
          </View>
          <View className="flex-row flex-wrap gap-xs">
            {exercise.setBadges.map(({ type, label }) => (
              <Badge key={type} label={label} tone={type} />
            ))}
          </View>
        </View>
      ))}
    </TemplateSurfaceCard>
  );
});
