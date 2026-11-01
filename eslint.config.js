const js = require('@eslint/js');
const pluginSecurity = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  pluginSecurity.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow unused parameters if prefixed with an underscore (e.g. Express error middleware _next).
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // detect-object-injection has a well-known high false-positive rate on standard bracket access.
      'security/detect-object-injection': 'off',
    },
  },
  {
    // Database migrations and test setup read trusted internal filesystem paths, not user inputs.
    files: ['db/**/*.js', 'test/**/*.js'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['node_modules/', 'coverage/'],
  },
];
