// src/components/layout/ScreenSection.tsx

import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";
import { cn } from "@/shared/utils/cn";

type ScreenSectionSpacing = "none" | "compact" | "normal" | "loose";

type ScreenSectionProps = {
  title?: string;
  children: ReactNode;
  spacing?: ScreenSectionSpacing;
  className?: string;
  contentClassName?: string;
};

const spacingClasses: Record<ScreenSectionSpacing, string> = {
  none: "mt-0",
  compact: "mt-5",
  normal: "mt-8",
  loose: "mt-12",
};

export function ScreenSection({
  title,
  children,
  spacing = "normal",
  className,
  contentClassName,
}: ScreenSectionProps) {
  return (
    <View className={cn(spacingClasses[spacing], className)}>
      {title ? (
        <AppText variant="sectionLabel" className="mb-3">
          {title}
        </AppText>
      ) : null}

      <View className={cn("gap-3", contentClassName)}>{children}</View>
    </View>
  );
}
