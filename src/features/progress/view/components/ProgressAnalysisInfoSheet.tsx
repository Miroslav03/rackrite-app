import { ScrollView, useWindowDimensions } from "react-native";

import { BottomSheet } from "@/shared/components/ui/BottomSheet";
import { AppText } from "@/shared/components/ui/AppText";

export function ProgressAnalysisInfoSheet({
  open,
  paragraphs,
  onClose,
}: {
  open: boolean;
  paragraphs: readonly string[];
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();

  return (
    <BottomSheet open={open} title="How lift analysis works" onClose={onClose}>
      <ScrollView
        style={{ maxHeight: height * 0.65 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
      >
        {paragraphs.map((paragraph) => (
          <AppText key={paragraph} className="text-sm leading-6">
            {paragraph}
          </AppText>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}
