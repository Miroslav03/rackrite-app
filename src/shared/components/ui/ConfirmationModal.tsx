import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import { AppModal } from "@/shared/components/ui/AppModal";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export type ConfirmationModalOperation =
  | { status: "idle" }
  | {
      status: "pending";
      label: string;
    };

export type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  operation: ConfirmationModalOperation;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  operation,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  const pending = operation.status === "pending";

  return (
    <AppModal
      open={open}
      dismissible={!pending}
      accessibilityLabel={`${title} confirmation`}
      surfaceClassName="border-l-4 border-l-primary"
      contentClassName="gap-lg"
      onClose={onClose}
    >
      <View className="gap-md">
        <View className="flex-row items-center gap-md">
          <MaterialCommunityIcons
            name="check-bold"
            size={24}
            color={colors.primary}
          />

          <AppText
            accessibilityRole="header"
            variant="title"
            className="flex-1 text-[20px]"
          >
            {title}
          </AppText>
        </View>

        <AppText variant="body">{description}</AppText>
      </View>

      <View className="flex-row gap-sm">
        <Button
          title="Cancel"
          variant="solid"
          intent="neutral"
          className="flex-1"
          disabled={pending}
          accessibilityState={{ disabled: pending }}
          onPress={onClose}
        />

        <Button
          title={pending ? operation.label : confirmLabel}
          variant="solid"
          intent="primary"
          className="flex-1"
          disabled={pending}
          accessibilityState={{ disabled: pending, busy: pending }}
          leftIcon={
            pending ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : undefined
          }
          onPress={onConfirm}
        />
      </View>
    </AppModal>
  );
}
