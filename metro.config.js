const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Needed for Drizzle generated .sql migrations
config.resolver.sourceExts.push("sql");

// Needed for expo-sqlite on web
config.resolver.assetExts.push("wasm");

module.exports = config;
