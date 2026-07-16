import { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { cn } from "@/shared/utils/cn";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
  rightAccessory?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  className,
  rightAccessory,
}: ScreenHeaderProps) {
  return (
    <View className={cn(className)}>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <AppText variant="title" className="uppercase italic tracking-tight">
            {title}
          </AppText>

          {subtitle ? (
            <AppText variant="subtitle" className="mt-2">
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {rightAccessory ? <View className="pb-1">{rightAccessory}</View> : null}
      </View>
    </View>
  );
}
