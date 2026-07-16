import { View } from "react-native";

import { AppText } from "@/shared/components/ui/AppText";

type HeaderMetricProps = {
  value: string;
  label: string;
};

export function HeaderMetric({ value, label }: HeaderMetricProps) {
  return (
    <View className="items-end">
      <AppText
        variant="body"
        className="text-2xl font-black leading-7 text-primarySoft"
      >
        {value}
      </AppText>

      <AppText variant="sectionLabel" className="mt-0.5 text-right text-muted">
        {label}
      </AppText>
    </View>
  );
}
