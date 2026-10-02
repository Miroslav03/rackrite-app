import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/shared/components/ui/BottomSheet";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export type TemplateOption =
  { type: "removeTemplate" } | { type: "editTemplate" };

type TemplateOptionsSheetProps = {
  templateName: string;
  onOptionSelect: (option: TemplateOption) => void;
  onClose: () => void;
};

export function TemplateOptionsSheet({
  templateName,
  onOptionSelect,
  onClose,
}: TemplateOptionsSheetProps) {
  return (
    <BottomSheet open title={templateName} onClose={onClose}>
      <Button
        title="Edit Template"
        variant="ghost"
        intent="neutral"
        leftIcon={
          <Ionicons name="create-outline" size={18} color={colors.muted} />
        }
        onPress={() => onOptionSelect({ type: "editTemplate" })}
      />
      <Button
        title="Remove Template"
        variant="ghost"
        intent="danger"
        leftIcon={
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        }
        onPress={() => onOptionSelect({ type: "removeTemplate" })}
      />
    </BottomSheet>
  );
}
