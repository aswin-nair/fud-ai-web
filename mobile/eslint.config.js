// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    // eslint-plugin-import's case check walks every parent directory. In the
    // Windows desktop sandbox that reaches the protected profile directory
    // before linting starts. Resolution itself still runs, and Windows paths
    // are case-insensitive, so disable only the redundant case probe there.
    rules: process.platform === 'win32'
      ? { 'import/no-unresolved': ['error', { caseSensitive: false }] }
      : {},
  },
]);
