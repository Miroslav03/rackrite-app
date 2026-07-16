import type { ReactNode } from "react";
import { Pressable, type PressableProps, View } from "react-native";

import { cn } from "@/shared/utils/cn";

import { AppText } from "../ui/AppText";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonIntent = "primary" | "danger" | "neutral";
type ButtonSize = "md" | "lg";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  intent?: ButtonIntent;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  textClassName?: string;
};

const base = "flex-row items-center justify-center rounded-button";

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-12 px-5",
  lg: "h-16 px-6",
};

const textSizeClasses: Record<ButtonSize, string> = {
  md: "text-[14px]",
  lg: "text-[16px]",
};

const variantIntentClasses: Record<
  ButtonVariant,
  Record<ButtonIntent, string>
> = {
  solid: {
    primary: "bg-primary",
    danger: "bg-error-solid",
    neutral: "bg-surface-high",
  },

  outline: {
    primary: "border border-primary bg-transparent",
    danger: "border border-error-border bg-transparent",
    neutral: "border border-outline bg-surface",
  },

  ghost: {
    primary: "bg-transparent",
    danger: "bg-transparent",
    neutral: "bg-transparent",
  },
};

const textIntentClasses: Record<ButtonVariant, Record<ButtonIntent, string>> = {
  solid: {
    primary: "text-white",
    danger: "text-white",
    neutral: "text-foreground",
  },

  outline: {
    primary: "text-primary-soft",
    danger: "text-error",
    neutral: "text-foreground",
  },

  ghost: {
    primary: "text-primary-soft",
    danger: "text-error",
    neutral: "text-muted",
  },
};

export function Button({
  title,
  variant = "solid",
  intent = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      className={cn(
        base,
        sizeClasses[size],
        variantIntentClasses[variant][intent],
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <View className="flex-row items-center justify-center gap-sm">
        {leftIcon}

        <AppText
          variant="button"
          className={cn(
            textSizeClasses[size],
            textIntentClasses[variant][intent],
            textClassName,
          )}
        >
          {title}
        </AppText>

        {rightIcon}
      </View>
    </Pressable>
  );
}
