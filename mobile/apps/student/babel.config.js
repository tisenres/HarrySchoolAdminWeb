module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove problematic reanimated plugin for now
      // 'react-native-reanimated/plugin',
    ],
  };
};