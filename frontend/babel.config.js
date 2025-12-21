module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router
      'expo-router/babel',
      // React Native Reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};
