// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure that the ONNX file extension is recognized as an asset.
if (!config.resolver.assetExts.includes("onnx")) {
  config.resolver.assetExts.push("onnx");
}

module.exports = config;

