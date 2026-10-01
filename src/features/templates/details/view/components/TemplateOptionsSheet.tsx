import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "@/shared/components/ui/BottomSheet";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export type TemplateOption = "removeTemplate";

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
        title="Remove Template"
        variant="ghost"
        intent="danger"
        leftIcon={
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        }
        onPress={() => onOptionSelect("removeTemplate")}
      />
    </BottomSheet>
  );
}
