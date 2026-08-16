const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle ships migrations as raw .sql files that the generated bundle imports.
config.resolver.sourceExts.push('sql');

module.exports = config;
