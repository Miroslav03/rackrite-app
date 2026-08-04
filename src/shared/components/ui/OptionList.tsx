import { Pressable, View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { SurfaceCard } from "@/shared/components/ui/SurfaceCard";
import { cn } from "@/shared/utils/cn";

export type OptionListOption<TId extends string = string> = {
  id: TId;
  label: string;
};

type OptionListProps<TId extends string> = {
  options: OptionListOption<TId>[];
  selectedId?: TId;
  onSelect: (option: OptionListOption<TId>) => void;
};

export function OptionList<TId extends string>({
  options,
  selectedId,
  onSelect,
}: OptionListProps<TId>) {
  return (
    <View className="gap-sm">
      {options.map((option) => {
        const selected = option.id === selectedId;

        return (
          <Pressable key={option.id} onPress={() => onSelect(option)}>
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
  );
}
