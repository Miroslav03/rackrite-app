import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { ToastViewport } from "@/shared/components/feedback/ToastViewport";
import { AppText } from "@/shared/components/ui/AppText";

type BottomSheetProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  dismissible?: boolean;
  onClose: () => void;
};

export function BottomSheet({
  open,
  title,
  children,
  dismissible = true,
  onClose,
}: BottomSheetProps) {
  function handleClose() {
    if (dismissible) {
      onClose();
    }
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close bottom sheet"
          accessibilityState={{ disabled: !dismissible }}
          className="flex-1"
          disabled={!dismissible}
          onPress={handleClose}
        />

        <View className="bg-surface px-screenX pb-8 pt-lg">
          <AppText variant="sectionLabel" className="mb-md">
            {title}
          </AppText>

          {children}
        </View>

        {open ? <ToastViewport layer="modal" /> : null}
      </View>
    </Modal>
  );
}
