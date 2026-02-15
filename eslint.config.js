const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "import/no-unresolved": ["error", { ignore: ["react-native-reanimated"] }],
    },
  },
]);
