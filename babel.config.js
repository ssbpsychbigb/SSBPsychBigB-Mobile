module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.json',
        ],
        alias: {
          '@': './src',
        },
      },
    ],
    // ! Reanimated 4: worklets plugin must be listed last (not reanimated/plugin).
    // * https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
    'react-native-worklets/plugin',
  ],
};
