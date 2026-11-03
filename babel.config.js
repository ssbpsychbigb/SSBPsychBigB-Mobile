module.exports = function (api) {
  // * Re-read .env on each compile so API_BASE_URL edits apply without a stale Babel cache.
  api.cache(false);

  return {
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
      './scripts/babel-plugin-inline-app-env.js',
      // ! Reanimated 4: worklets plugin must be listed last (not reanimated/plugin).
      'react-native-worklets/plugin',
    ],
  };
};
