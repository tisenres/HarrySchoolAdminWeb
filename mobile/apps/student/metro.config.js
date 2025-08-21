const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web compatibility
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;