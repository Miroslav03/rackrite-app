import type { SetType } from "@/domain/domain.types";
import type { TemplateSet } from "@/domain/templates/editor/templates.types";
import { Ionicons } from "@expo/vector-icons";

import {
  RpePickerPanel,
  type RpePickerValue,
} from "@/shared/components/exercise-editor/RpePickerPanel";
import { SetEditorDock } from "@/shared/components/exercise-editor/SetEditorDock";
import { SetTypePickerPanel } from "@/shared/components/exercise-editor/SetTypePickerPanel";
import { EditorOptionButton } from "@/shared/components/ui/EditorOptionButton";
import {
  InteractiveKeypad,
  type InteractiveKeypadKey,
} from "@/shared/components/ui/InteractiveKeypad";
import { colors } from "@/shared/theme/tokens";

import type { TemplateEditorPanel } from "./templateEditorDock.types";

type TemplateEditorDockProps = {
  exerciseName: string;
  activeSet: TemplateSet;
  setCount: number;
  panel: TemplateEditorPanel;
  disabled: boolean;
  onPressRepsKey: (key: InteractiveKeypadKey) => void;
  onSelectRpe: (rpe: RpePickerValue | null) => void;
  onSelectSetType: (type: SetType) => void;
  onClose: () => void;
  onDelete: () => void;
  onHeightChange: (height: number) => void;
};

export function TemplateEditorDock({
  exerciseName,
  activeSet,
  setCount,
  panel,
  disabled,
  onPressRepsKey,
  onSelectRpe,
  onSelectSetType,
  onClose,
  onDelete,
  onHeightChange,
}: TemplateEditorDockProps) {
  return (
    <SetEditorDock
      exerciseName={exerciseName}
      setNumber={activeSet.setIndex + 1}
      setCount={setCount}
      setType={activeSet.type}
      panelLabel={
        panel.type === "repsKeypad"
          ? "Reps"
          : panel.type === "rpe"
            ? "RPE"
            : "Set Type"
      }
      disabled={disabled}
      onDelete={onDelete}
      onHeightChange={onHeightChange}
      headerAction={
        <EditorOptionButton
          variant="icon"
          accessibilityLabel="Close set editor"
          accessibilityHint="Keeps your changes and clears the selected set"
          accessibilityState={{ disabled }}
          disabled={disabled}
          hitSlop={4}
          icon={
            <Ionicons name="chevron-down" size={20} color={colors.foreground} />
          }
          onPress={onClose}
        />
      }
    >
      {panel.type === "repsKeypad" ? (
        <InteractiveKeypad
          disabled={disabled}
          allowDecimal={false}
          inputLabel="reps"
          onPress={onPressRepsKey}
        />
      ) : panel.type === "rpe" ? (
        <RpePickerPanel
          rpe={activeSet.rpe}
          disabled={disabled}
          onSelect={onSelectRpe}
        />
      ) : (
        <SetTypePickerPanel
          setType={activeSet.type}
          disabled={disabled}
          onSelect={onSelectSetType}
        />
      )}
    </SetEditorDock>
  );
}
