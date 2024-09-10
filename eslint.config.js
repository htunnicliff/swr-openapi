import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  prettier,
  {
    files: ["**/*.{js,ts}"],
    rules: {
      // openapi-fetch uses `{}` as Paths type
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow `_` prefix for unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Allow throwing anything
      "@typescript-eslint/only-throw-error": "off",
    },
  },
);
