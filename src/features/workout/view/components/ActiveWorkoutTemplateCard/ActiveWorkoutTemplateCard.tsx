import { View } from "react-native";

import type { WorkoutAggregate } from "@/domain/workout/workout.types";

import { AppText } from "@/shared/components/ui/AppText";
import { TemplateSurfaceCard } from "@/shared/components/ui/TemplateSurfaceCard";

import {
  createActiveWorkoutTemplateCardViewModel,
  getActiveWorkoutFooterContent,
} from "./ActiveWorkoutTemplateCard.viewModel";

type ActiveWorkoutTemplateCardProps = {
  workout: WorkoutAggregate;
  onPress: () => void;
};

export function ActiveWorkoutTemplateCard({
  workout,
  onPress,
}: ActiveWorkoutTemplateCardProps) {
  const viewModel = createActiveWorkoutTemplateCardViewModel(workout);
  const footer = getActiveWorkoutFooterContent(viewModel);

  const exerciseName = viewModel.exerciseName ?? "No Exercise Selected";
  const progress = `${viewModel.activeSetPosition} OF ${viewModel.totalSets} SETS`;

  return (
    <TemplateSurfaceCard
      accessibilityHint="Opens your active workout"
      accessibilityLabel={[
        viewModel.workoutName,
        exerciseName,
        progress,
        footer.label,
        footer.value,
      ].join(", ")}
      footer={
        <View>
          <AppText variant="sectionLabel">{footer.label}</AppText>
          <AppText
            numberOfLines={1}
            variant="button"
            className="mt-xs text-xl tracking-tight"
          >
            {footer.value}
          </AppText>
        </View>
      }
      onPress={onPress}
      surfaceAccent="primary"
      surfaceClassName="border-l-primary bg-surfaceLow"
      surfaceVariant="high"
    >
      <AppText
        numberOfLines={1}
        variant="logo"
        className="text-2xl tracking-tight"
      >
        {viewModel.workoutName}
      </AppText>

      <AppText
        numberOfLines={2}
        variant="subtitle"
        className="mt-sm leading-5 text-muted"
      >
        {exerciseName} · {progress}
      </AppText>
    </TemplateSurfaceCard>
  );
}
