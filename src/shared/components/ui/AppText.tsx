import { Text, TextProps } from "react-native";

import { cn } from "@/shared/utils/cn";

type AppTextVariant =
  "title" | "subtitle" | "body" | "logo" | "sectionLabel" | "button";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  className?: string;
};

const variants: Record<AppTextVariant, string> = {
  logo: "text-xl font-black italic tracking-widest text-foreground font-headline uppercase",
  title:
    "text-4xl font-black italic uppercase tracking-tighter leading-none text-foreground",
  subtitle: "text-xs font-bold uppercase tracking-[1.4px] text-muted",
  sectionLabel: "text-[8px] font-bold uppercase tracking-widest text-muted",
  button: "font-bold uppercase tracking-wider text-foreground",
  body: "text-base text-muted",
};

export function AppText({
  variant = "body",
  className,
  ...props
}: AppTextProps) {
  return <Text className={cn(variants[variant], className)} {...props} />;
}
