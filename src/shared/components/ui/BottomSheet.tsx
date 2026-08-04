import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";

type BottomSheetProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function BottomSheet({
  open,
  title,
  children,
  onClose,
}: BottomSheetProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-surface px-screenX pb-8 pt-lg">
          <AppText variant="sectionLabel" className="mb-md">
            {title}
          </AppText>

          {children}
        </View>
      </View>
    </Modal>
  );
}
