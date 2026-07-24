import type { ReactNode } from "react";
import {
  Pressable,
  View,
  type AccessibilityRole,
  type PressableProps,
} from "react-native";

import {
  SurfaceCard,
  type SurfaceCardAccent,
  type SurfaceCardVariant,
} from "@/shared/components/ui/SurfaceCard";
import { cn } from "@/shared/utils/cn";

export type TemplateSurfaceCardProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  footer: ReactNode;
  surfaceVariant?: SurfaceCardVariant;
  surfaceAccent?: SurfaceCardAccent;
  surfaceClassName?: string;
  contentClassName?: string;
  dividerClassName?: string;
  footerClassName?: string;
};

export function TemplateSurfaceCard({
  children,
  footer,
  surfaceVariant = "default",
  surfaceAccent = "none",
  surfaceClassName,
  contentClassName,
  dividerClassName,
  footerClassName,
  accessibilityRole,
  onPress,
  ...pressableProps
}: TemplateSurfaceCardProps) {
  const resolvedAccessibilityRole: AccessibilityRole | undefined =
    accessibilityRole ?? (onPress ? "button" : undefined);

  return (
    <Pressable
      accessibilityRole={resolvedAccessibilityRole}
      onPress={onPress}
      {...pressableProps}
    >
      <SurfaceCard
        accent={surfaceAccent}
        className={surfaceClassName}
        contentClassName="p-0"
        variant={surfaceVariant}
      >
        <View className={cn("px-sm pt-sm pb-xl", contentClassName)}>
          {children}
        </View>

        <View
          className={cn("mx-sm h-px bg-outline", dividerClassName)}
          importantForAccessibility="no"
        />

        <View className={cn("px-sm pb-sm pt-xl", footerClassName)}>
          {footer}
        </View>
      </SurfaceCard>
    </Pressable>
  );
}
