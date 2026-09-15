import { registerRootComponent } from "expo";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { darkTheme } from "@storybook/react-native-theming";

import { view } from "./storybook.requires";

const StorybookUI = view.getStorybookUI({
  theme: darkTheme,
  initialSelection: "progress-overview--derived-sample-history",
  shouldPersistSelection: true,
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
});

function StorybookRoot() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StorybookUI />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(StorybookRoot);
