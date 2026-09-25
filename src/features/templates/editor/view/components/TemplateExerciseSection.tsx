import type {
  TemplateExerciseAggregate,
  TemplateSetId,
} from "@/domain/templates/editor/templates.types";

import { formatExerciseKind } from "@/features/exercises/view/utils/formatExerciseKind";

import {
  SetCard,
  type SetCardField,
} from "@/shared/components/exercise-editor/SetCard";
import { ScreenSection } from "@/shared/components/layout/ScreenSection";
import { AppText } from "@/shared/components/ui/AppText";

import type { TemplateEditorPanelType } from "../TemplateEditorDock/templateEditorDock.types";

type TemplateExerciseSectionProps = {
  exerciseAggregate: TemplateExerciseAggregate;
  activeSetId: TemplateSetId | null;
  activeField?: TemplateEditorPanelType;
  repsDraft?: string;
  disabled: boolean;
  onOpenEditor: (setId: TemplateSetId, panel: TemplateEditorPanelType) => void;
};

export function TemplateExerciseSection({
  exerciseAggregate,
  activeSetId,
  activeField,
  repsDraft,
  disabled,
  onOpenEditor,
}: TemplateExerciseSectionProps) {
  function openField(setId: string, field: SetCardField) {
    if (field === "setType" || field === "repsKeypad" || field === "rpe")
      onOpenEditor(setId, field);
  }

  return (
    <ScreenSection>
      <AppText variant="title" className="text-[22px]">
        {exerciseAggregate.exercise.name}
      </AppText>

      <AppText variant="subtitle">
        {formatExerciseKind(exerciseAggregate.exercise.kind)}
      </AppText>

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
    </ScreenSection>
  );
}
