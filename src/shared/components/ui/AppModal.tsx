import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { cn } from "@/shared/utils/cn";

export type AppModalProps = {
  open: boolean;
  dismissible?: boolean;
  accessibilityLabel: string;
  children: ReactNode;
  backdropClassName?: string;
  surfaceClassName?: string;
  contentClassName?: string;
  onClose: () => void;
};

export function AppModal({
  open,
  dismissible = true,
  accessibilityLabel,
  children,
  backdropClassName,
  surfaceClassName,
  contentClassName,
  onClose,
}: AppModalProps) {
  function handleClose() {
    if (dismissible) {
      onClose();
    }
  }

  return (
    <Modal
      visible={open}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center px-screenX">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          accessibilityState={{ disabled: !dismissible }}
          className={cn("absolute inset-0 bg-black/70", backdropClassName)}
          disabled={!dismissible}
          onPress={handleClose}
        />

        <View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          className={cn(
            "w-full max-w-[420px] rounded-card bg-surface",
            surfaceClassName,
          )}
        >
          <View className={cn("p-xl", contentClassName)}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}
