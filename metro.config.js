const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Needed for Drizzle generated .sql migrations
config.resolver.sourceExts.push("sql");

// Needed for expo-sqlite on web
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, {
  input: "./src/global.css",
});
