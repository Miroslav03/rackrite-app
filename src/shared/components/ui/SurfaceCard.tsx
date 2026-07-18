import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/shared/utils/cn";

type SurfaceCardAccent = "none" | "primary" | "success" | "error";
type SurfaceCardVariant = "default" | "success" | "high";

type SurfaceCardProps = ViewProps & {
  children: ReactNode;
  variant?: SurfaceCardVariant;
  accent?: SurfaceCardAccent;
  selected?: boolean;
  className?: string;
  contentClassName?: string;
};

const variantClasses: Record<SurfaceCardVariant, string> = {
  default: "bg-surface",
  success: "bg-successSurface",
  high: "bg-surfaceHigh",
};

const accentClasses: Record<SurfaceCardAccent, string> = {
  none: "",
  primary: "border-l-4 border-l-primarySoft",
  success: "border-l-4 border-l-successBorder",
  error: "border-l-4 border-l-errorBorder",
};

export function SurfaceCard({
  children,
  variant = "default",
  accent = "none",
  selected = false,
  className,
  contentClassName,
  ...props
}: SurfaceCardProps) {
  return (
    <View
      className={cn(
        "rounded-card",
        variantClasses[variant],
        accentClasses[accent],
        selected && "border border-primarySoft",
        className,
      )}
      {...props}
    >
      <View className={cn("p-lg", contentClassName)}>{children}</View>
    </View>
  );
}
