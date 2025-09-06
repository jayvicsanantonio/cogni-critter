const {
  getDefaultConfig,
  mergeConfig,
} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@screens': './src/screens',
      '@services': './src/services',
      '@types': './src/types',
      '@utils': './src/utils',
      '@assets': './src/assets',
    },
    // Add asset extensions for TensorFlow.js model files
    assetExts: [
      'bin',
      'txt',
      'jpg',
      'png',
      'json',
      'mp4',
      'ttf',
      'otf',
      'xml',
      'svg',
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
