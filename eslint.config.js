import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config([
  globalIgnores(["docs/.vitepress/cache/**/*"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      {
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
          },
        },
      }, // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // *** OVERRIDE FOR src/types/api.ts ***
    files: ["frontend/src/types/api.ts"],
    rules: {
      // Disable 'consistent-indexed-object-style' specifically for this file
      "@typescript-eslint/consistent-indexed-object-style": "off",
    },
  },
  {
    // *** OVERRIDE FOR src/components/ui, all components in there are imported through shadcn/ui ***
    files: ["frontend/src/components/ui/**/*.{ts,tsx}"],
    rules: {
      // Disable 'consistent-indexed-object-style' specifically for this file
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unnecessary-template-expression": "off",
    },
  },
]);
