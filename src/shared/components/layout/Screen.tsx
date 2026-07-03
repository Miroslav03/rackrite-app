import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/shared/utils/cn";
import { AppHeader } from "./AppHeader";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  withHeader?: boolean;
  className?: string;
};

export function Screen({
  children,
  scroll = true,
  withHeader = true,
  className,
}: ScreenProps) {
  const content = (
    <View className={cn("flex-1 px-screenX pb-8", className)}>{children}</View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      {withHeader ? <AppHeader /> : null}

      {scroll ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
