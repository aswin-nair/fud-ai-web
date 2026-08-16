/**
 * Exists only so drizzle's generated migrations can be imported. The plugin
 * inlines each .sql file as a string at build time; without it Metro hands the
 * SQL to the JavaScript parser and the bundle fails.
 */
module.exports = function babelConfig(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
