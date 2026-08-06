import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import type {
  WorkoutExerciseAggregate,
  WorkoutSetId,
} from "@/domain/workout/workout.types";

import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";
import { WorkoutSetCard } from "./WorkoutSetCard";

type WorkoutExerciseSectionProps = {
  exerciseAggregate: WorkoutExerciseAggregate;
  activeSetId: WorkoutSetId | null;
  onOpenOptions: () => void;
  className?: string;
};

export function WorkoutExerciseSection({
  exerciseAggregate,
  activeSetId,
  onOpenOptions,
  className,
}: WorkoutExerciseSectionProps) {
  const { exercise, sets } = exerciseAggregate;

  return (
    <ScreenSection className={className}>
      <View className="flex-row items-start justify-between gap-md">
        <View className="flex-1">
          <AppText variant="title" className="text-[22px]">
            {exercise.name}
          </AppText>

          <AppText variant="subtitle">
            {formatExerciseKind(exercise.kind)}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${exercise.name}`}
          hitSlop={12}
          onPress={onOpenOptions}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.muted} />
        </Pressable>
      </View>
      {/* TODO: Should add notes with desgin later here */}

      {sets.map((set) => {
        const status =
          set.finishedAt !== null
            ? "completed"
            : set.id === activeSetId
              ? "active"
              : "pending";

        return (
          <WorkoutSetCard
            key={set.id}
            setIndex={set.setIndex + 1}
            setType={formatSetType(set.type)}
            weight={set.weight}
            reps={set.reps}
            rpe={set.rpe}
            status={status}
          />
        );
      })}

      <Button
        title="Add Set"
        variant="ghost"
        intent="neutral"
        size="md"
        leftIcon={<Ionicons name="add" size={18} color={colors.muted} />}
      />
    </ScreenSection>
  );
}

function formatSetType(
  type: WorkoutExerciseAggregate["sets"][number]["type"],
): string {
  switch (type) {
    case "warmup":
      return "Warm-up";

    case "working":
      return "Working";

    case "top":
      return "Top Set";

    case "backoff":
      return "Backoff";
  }
}
