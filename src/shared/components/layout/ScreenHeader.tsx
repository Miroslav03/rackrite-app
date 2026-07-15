import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { cn } from "@/shared/utils/cn";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function ScreenHeader({
  title,
  subtitle,
  className,
}: ScreenHeaderProps) {
  return (
    <View className={cn(className)}>
      <AppText variant="title" className="uppercase italic tracking-tight">
        {title}
      </AppText>

      {subtitle ? (
        <AppText variant="subtitle" className="mt-2">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
