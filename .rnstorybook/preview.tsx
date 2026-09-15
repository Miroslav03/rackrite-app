import type { Preview } from "@storybook/react-native";

import { View } from "react-native";

import "../src/global.css";
import { ToastProvider } from "../src/shared/components/feedback/ToastProvider";
import { colors } from "../src/shared/theme/tokens";

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ToastProvider key={context.id}>
          <Story />
        </ToastProvider>
      </View>
    ),
  ],
};

export default preview;
