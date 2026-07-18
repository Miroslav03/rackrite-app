// src/shared/components/ui/OptionSheet.tsx

import { Modal, Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { cn } from "@/shared/utils/cn";

type Option = {
  id: string;
  label: string;
};

type OptionSheetProps = {
  open: boolean;
  title: string;
  options: Option[];
  selectedId?: string;
  onClose: () => void;
  onSelect: (option: Option) => void;
};

export function OptionSheet({
  open,
  title,
  options,
  selectedId,
  onClose,
  onSelect,
}: OptionSheetProps) {
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

          <View className="gap-sm">
            {options.map((option) => {
              const selected = option.id === selectedId;

              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <SurfaceCard
                    variant={selected ? "high" : "default"}
                    accent={selected ? "primary" : "none"}
                    contentClassName="py-md px-lg"
                  >
                    <AppText
                      variant="body"
                      className={cn(
                        "font-bold text-foreground",
                        selected && "text-primarySoft",
                      )}
                    >
                      {option.label}
                    </AppText>
                  </SurfaceCard>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
