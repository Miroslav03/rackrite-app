import type {
  TemplateExerciseAggregate,
  TemplateExerciseId,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import {
  SetCard,
  type SetCardField,
} from "@/shared/components/set-editor/SetCard";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import type { TemplateEditorPanelType } from "../TemplateEditorDock/templateEditorDock.types";

type TemplateExerciseSectionProps = {
  exerciseAggregate: TemplateExerciseAggregate;
  activeSetId: TemplateSetId | null;
  activeField?: TemplateEditorPanelType;
  repsDraft?: string;
  disabled: boolean;
  canReorder: boolean;
  onOpenOptions: (templateExerciseId: TemplateExerciseId) => void;
  onOpenOrderEditor: (templateExerciseId: TemplateExerciseId) => void;
  onAddSet: (templateExerciseId: TemplateExerciseId) => void;
  onOpenEditor: (setId: TemplateSetId, panel: TemplateEditorPanelType) => void;
};

export function TemplateExerciseSection({
  exerciseAggregate,
  activeSetId,
  activeField,
  repsDraft,
  disabled,
  canReorder,
  onOpenOptions,
  onOpenOrderEditor,
  onAddSet,
  onOpenEditor,
}: TemplateExerciseSectionProps) {
  const { templateExercise, exercise } = exerciseAggregate;

  function openField(setId: string, field: SetCardField) {
    if (field === "setType" || field === "repsKeypad" || field === "rpe")
      onOpenEditor(setId, field);
  }

  return (
    <ScreenSection>
      <View className="flex-row items-start justify-between gap-md">
        <Pressable
          className="flex-1"
          accessibilityRole="button"
          accessibilityLabel={exercise.name}
          accessibilityHint="Opens exercise reordering"
          accessibilityState={{ disabled: disabled || !canReorder }}
          disabled={disabled || !canReorder}
          delayLongPress={300}
          onAccessibilityTap={() => onOpenOrderEditor(templateExercise.id)}
          onLongPress={() => onOpenOrderEditor(templateExercise.id)}
        >
          <AppText variant="title" className="text-[22px]">
            {exercise.name}
          </AppText>
          <AppText variant="subtitle">
            {formatExerciseKind(exercise.kind)}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${exercise.name}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          hitSlop={12}
          onPress={() => onOpenOptions(templateExercise.id)}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {exerciseAggregate.sets.map((set) => {
        const selected = set.id === activeSetId;

        return (
          <SetCard
            key={set.id}
            setId={set.id}
            setIndex={set.setIndex + 1}
            setType={set.type}
            showWeight={false}
            reps={set.reps}
            repsDraft={selected ? repsDraft : undefined}
            rpe={set.rpe}
            status={selected ? "active" : "pending"}
            selected={selected}
            activeField={selected ? activeField : undefined}
            disabled={disabled}
            onOpenEditor={openField}
          />
        );
      })}
      <Button
        title="Add Set"
        variant="ghost"
        intent="neutral"
        size="md"
        disabled={disabled}
        accessibilityLabel={`Add set to ${exercise.name}`}
        accessibilityState={{ disabled }}
        leftIcon={<Ionicons name="add" size={18} color={colors.muted} />}
        onPress={() => onAddSet(templateExercise.id)}
      />
    </ScreenSection>
  );
}
