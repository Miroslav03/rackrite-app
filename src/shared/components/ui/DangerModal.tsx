import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import { AppModal } from "@/shared/components/ui/AppModal";
import { AppText } from "@/shared/components/ui/AppText";
import { Button } from "@/shared/components/ui/Button";
import { colors } from "@/shared/theme/tokens";

export type DangerModalOperation =
  | { status: "idle" }
  | {
      status: "pending";
      label: string;
    }
  | {
      status: "error";
      message: string;
    };

export type DangerModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  operation: DangerModalOperation;
  onConfirm: () => void;
  onClose: () => void;
};

export function DangerModal({
  open,
  title,
  description,
  confirmLabel,
  operation,
  onConfirm,
  onClose,
}: DangerModalProps) {
  const pending = operation.status === "pending";

  return (
    <AppModal
      open={open}
      dismissible={!pending}
      accessibilityLabel={`${title} confirmation`}
      surfaceClassName="border-l-4 border-l-errorBorder"
      contentClassName="gap-lg"
      onClose={onClose}
    >
      <View className="gap-md">
        <View className="flex-row items-center gap-md">
          <Ionicons name="warning-outline" size={24} color={colors.error} />

          <AppText
            accessibilityRole="header"
            variant="title"
            className="flex-1 text-[20px]"
          >
            {title}
          </AppText>
        </View>

        <AppText variant="body">{description}</AppText>

        {operation.status === "error" && (
          <AppText variant="body" className="text-error">
            {operation.message}
          </AppText>
        )}
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
          intent="danger"
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
