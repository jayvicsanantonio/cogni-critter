const { getDefaultConfig } = require('expo/metro-config')

/**
 * Metro configuration (Expo)
 * Use Expo's metro-config so that the dev client virtual entry (./.expo/.virtual-metro-entry)
 * is provided correctly. We then extend the resolver with our aliases and required assetExts.
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname)

// Ensure resolver and alias map exist
config.resolver = config.resolver || {}
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@services': './src/services',
  '@types': './src/types',
  '@utils': './src/utils',
  '@assets': './src/assets',
}

// Ensure required asset extensions are included (union)
const extraAssetExts = ['bin', 'txt', 'xml', 'svg']
const currentAssetExts = new Set([...(config.resolver.assetExts || [])])
extraAssetExts.forEach((ext) => currentAssetExts.add(ext))
config.resolver.assetExts = Array.from(currentAssetExts)

module.exports = config
