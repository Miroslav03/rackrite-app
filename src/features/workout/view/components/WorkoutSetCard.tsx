import { Ionicons } from "@expo/vector-icons";

import { Pressable, View } from "react-native";

import type { ActiveSetEditorPanelType } from "@/features/workout/view/components/ActiveSetEditor/activeSetEditor.types";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { colors } from "@/shared/theme/tokens";
import { cn } from "@/shared/utils/cn";

type WorkoutSetStatus = "completed" | "active" | "pending";

type WorkoutSetCardProps = {
  setIndex: number;
  setType: string;
  weight: number | null;
  weightDraft?: string;
  reps: number | null;
  repsDraft?: string;
  rpe: number | null;
  status?: WorkoutSetStatus;
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
  className,
  disabled,
  onSelect,
  onEditField,
}: WorkoutSetCardProps) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select set ${setIndex}`}
      accessibilityState={{ disabled, selected: isActive }}
      disabled={disabled}
      className={className}
      onPress={onSelect}
    >
      <SurfaceCard
        variant={isCompleted ? "success" : isActive ? "high" : "default"}
        accent={isCompleted ? "success" : isActive ? "primary" : "none"}
        selected={isActive}
        contentClassName="min-h-[58px] flex-row items-center gap-md px-md py-sm"
        className={cn(isPending && "opacity-60")}
      >
        <View className="min-h-11 w-10 items-center justify-center">
          <AppText
            variant="sectionLabel"
            className={cn(
              "mb-xs text-center",
              isCompleted && "text-successBorder",
            )}
          >
            Set {setIndex}
          </AppText>

          <View
            className={cn(
              "h-4 w-4 items-center justify-center overflow-hidden rounded-full",
              isCompleted ? "bg-successBorder" : "bg-surfaceHighest",
            )}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={10} color={colors.background} />
            ) : isActive ? (
              <View className="h-1.5 w-1.5 rounded-full bg-primarySoft" />
            ) : null}
          </View>
        </View>

        <SetFieldButton
          label="Type"
          value={setType}
          disabled={disabled}
          className="flex-[1.4]"
          onPress={() => onEditField("setType")}
        />

        <SetFieldButton
          label="Weight (KG)"
          value={formatNumericSetValue(weight, weightDraft)}
          disabled={disabled}
          onPress={() => onEditField("weightKeypad")}
        />

        <SetFieldButton
          label="Reps"
          value={formatNumericSetValue(reps, repsDraft)}
          disabled={disabled}
          onPress={() => onEditField("repsKeypad")}
        />

        <SetFieldButton
          label="RPE"
          value={rpe !== null ? String(rpe) : "—"}
          disabled={disabled}
          onPress={() => onEditField("rpe")}
        />
      </SurfaceCard>
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
  disabled?: boolean;
  className?: string;
  onPress: () => void;
};

function SetFieldButton({
  label,
  value,
  disabled,
  className,
  onPress,
}: SetFieldButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label.toLowerCase()}`}
      accessibilityValue={{ text: value }}
      accessibilityState={{ disabled }}
      disabled={disabled}
      className={cn("min-h-11 flex-1 items-center justify-center", className)}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
    >
      <AppText variant="sectionLabel">{label}</AppText>
      <AppText className="text-sm font-black text-foreground">{value}</AppText>
    </Pressable>
  );
}
