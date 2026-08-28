import { Ionicons } from "@expo/vector-icons";

import { Pressable, View } from "react-native";

import type { SetType } from "@/domain/domain.types";

import { SET_TYPE_CONFIG } from "@/features/workout/view/activeWorkout.config";
import type { ActiveSetEditorPanelType } from "@/features/workout/view/components/ActiveSetEditor/activeSetEditor.types";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

type WorkoutSetStatus = "completed" | "active" | "pending";

type WorkoutSetCardProps = {
  setIndex: number;
  setType: SetType;
  weight: number | null;
  weightDraft?: string;
  reps: number | null;
  repsDraft?: string;
  rpe: number | null;
  status?: WorkoutSetStatus;
  selected?: boolean;
  activeField?: ActiveSetEditorPanelType;
  disabled?: boolean;
  className?: string;
  onSelect: () => void;
  onEditField: (field: ActiveSetEditorPanelType) => void;
};

export function WorkoutSetCard({
  setIndex,
  setType,
  weight,
  weightDraft,
  reps,
  repsDraft,
  rpe,
  status = "pending",
  selected = false,
  activeField,
  className,
  disabled,
  onSelect,
  onEditField,
}: WorkoutSetCardProps) {
  const isCompleted = status === "completed";
  const isSelected = status === "active" || selected;
  const isPending = status === "pending";
  const setTypeConfig = SET_TYPE_CONFIG[setType];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select set ${setIndex}`}
      accessibilityState={{ disabled, selected: isSelected }}
      disabled={disabled}
      className={className}
      onPress={onSelect}
    >
      <SurfaceCard
        variant={isSelected ? "high" : "default"}
        contentClassName="min-h-[58px] flex-row items-center gap-md px-md py-sm"
        className={cn(isPending && "opacity-60")}
        style={
          isCompleted
            ? {
                backgroundColor: setTypeConfig.tintColor,
                borderLeftColor: setTypeConfig.accentColor,
                borderLeftWidth: 4,
              }
            : undefined
        }
      >
        <View className="min-h-11 w-10 items-center justify-center">
          <AppText
            variant="sectionLabel"
            className="mb-xs text-center"
            style={
              isCompleted ? { color: setTypeConfig.accentColor } : undefined
            }
          >
            Set {setIndex}
          </AppText>

          <View
            className="h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-surfaceHighest"
            style={
              isCompleted
                ? { backgroundColor: setTypeConfig.accentColor }
                : undefined
            }
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={10} color={colors.background} />
            ) : isSelected ? (
              <View
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: setTypeConfig.accentColor }}
              />
            ) : null}
          </View>
        </View>

        <SetFieldButton
          label="Type"
          value={setTypeConfig.label}
          valueColor={setTypeConfig.accentColor}
          disabled={disabled}
          className="flex-[1.4]"
          onPress={() => onEditField("setType")}
        />

        <SetFieldButton
          label="Weight (KG)"
          value={formatNumericSetValue(weight, weightDraft)}
          highlightColor={setTypeConfig.accentColor}
          highlighted={
            isSelected &&
            (activeField === "weight" || activeField === "weightKeypad")
          }
          disabled={disabled}
          onPress={() => onEditField("weightKeypad")}
        />

        <SetFieldButton
          label="Reps"
          value={formatNumericSetValue(reps, repsDraft)}
          highlightColor={setTypeConfig.accentColor}
          highlighted={isSelected && activeField === "repsKeypad"}
          disabled={disabled}
          onPress={() => onEditField("repsKeypad")}
        />

        <SetFieldButton
          label="RPE"
          value={rpe !== null ? String(rpe) : "—"}
          highlightColor={setTypeConfig.accentColor}
          highlighted={isSelected && activeField === "rpe"}
          disabled={disabled}
          onPress={() => onEditField("rpe")}
        />
      </SurfaceCard>
      {isSelected ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 rounded-card border"
          style={{ borderColor: setTypeConfig.accentColor }}
        />
      ) : null}
    </Pressable>
  );
}

function formatNumericSetValue(
  value: number | null,
  draft: string | undefined,
): string {
  if (draft !== undefined) {
    return draft === "" ? "—" : draft;
  }

  return value === null ? "—" : String(value);
}

type SetFieldButtonProps = {
  label: string;
  value: string;
  valueColor?: string;
  highlightColor?: string;
  highlighted?: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
};

function SetFieldButton({
  label,
  value,
  valueColor,
  highlightColor,
  highlighted = false,
  disabled,
  className,
  onPress,
}: SetFieldButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label.toLowerCase()}`}
      accessibilityValue={{ text: value }}
      accessibilityState={{ disabled, selected: highlighted }}
      disabled={disabled}
      className={cn("min-h-11 flex-1 items-center justify-center", className)}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
    >
      <AppText
        variant="sectionLabel"
        className={cn(highlighted)}
        style={
          highlighted && highlightColor ? { color: highlightColor } : undefined
        }
      >
        {label}
      </AppText>
      <AppText
        className="text-sm font-black text-foreground"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </AppText>
    </Pressable>
  );
}
