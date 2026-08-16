const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle ships migrations as raw .sql files. The resolver has to find them and
// babel-plugin-inline-import turns each into a string before parsing.
config.resolver.sourceExts.push('sql');

// expo-sqlite runs SQLite as WebAssembly in a worker on web.
config.resolver.assetExts.push('wasm');

// That worker needs SharedArrayBuffer, which browsers only expose to
// cross-origin-isolated documents. Affects the dev server only.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  return middleware(req, res, next);
};

module.exports = config;
