import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/shared/components/ui/BottomSheet";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export type WorkoutExerciseOption = "removeExercise";

type WorkoutExerciseOptionsSheetProps = {
  exerciseName: string;
  onOptionSelect: (option: WorkoutExerciseOption) => void;
  onClose: () => void;
};

export function WorkoutExerciseOptionsSheet({
  exerciseName,
  onOptionSelect,
  onClose,
}: WorkoutExerciseOptionsSheetProps) {
  return (
    <BottomSheet open title={exerciseName} onClose={onClose}>
      <Button
        title="Remove Exercise"
        variant="ghost"
        intent="danger"
        leftIcon={
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        }
        onPress={() => onOptionSelect("removeExercise")}
      />
    </BottomSheet>
  );
}
