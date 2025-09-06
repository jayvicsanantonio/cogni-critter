module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@types': './src/types',
          '@utils': './src/utils',
          '@assets': './src/assets',
        },
      },
    ],
  ],
};
