import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintDevConfig = [
  ...compat.extends(
    "next/core-web-vitals"
  ),
  {
    languageOptions: {
      parserOptions: {
        // Disable project for faster linting
        project: false,
      },
    },
    rules: {
      // Keep only critical rules for development

      // Critical React rules only
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-vars": "error",

      // Critical Next.js rules only
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",

      // TypeScript - only unused vars (relaxed to warn)
      "@typescript-eslint/no-unused-vars": "warn",

      // Disable expensive type-aware rules
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unused-expressions": "off",

      // Disable import ordering for faster linting
      "import/order": "off",
      "import/no-unused-modules": "off",
      "import/no-duplicates": "off",

      // Disable accessibility rules in development
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/aria-props": "off",
      "jsx-a11y/aria-role": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/interactive-supports-focus": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/role-has-required-aria-props": "off",
      "jsx-a11y/role-supports-aria-props": "off",

      // Allow console logs in development
      "no-console": "off",
      "no-debugger": "warn",

      // Disable most general code quality rules
      "no-alert": "off",
      "no-eval": "error", // Keep for security
      "no-implied-eval": "off",
      "no-new-func": "off",
      "no-script-url": "off",
      "prefer-const": "warn",
      "no-var": "warn",
      "eqeqeq": "off",
      "curly": "off",
      "no-nested-ternary": "off",
      "prefer-template": "off",
      "no-useless-concat": "off",

      // Disable performance rules
      "no-loop-func": "off",
      "no-caller": "off",
      "no-extend-native": "off",
      "no-extra-bind": "off",
      "no-labels": "off",
      "no-lone-blocks": "off",
      "no-multi-spaces": "off",
      "no-new": "off",
      "no-new-object": "off",
      "no-new-wrappers": "off",
      "no-octal-escape": "off",
      "no-self-compare": "off",
      "no-sequences": "off",
      "no-throw-literal": "off",
      "no-unused-labels": "off",
      "no-useless-call": "off",
      "no-useless-escape": "off",
      "no-void": "off",
      "no-with": "off",
      "wrap-iife": "off",
      "yoda": "off",
    },
  },
  {
    // Even more relaxed rules for test files
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      // Disable everything except syntax errors for tests
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-console": "off",
    },
  },
  {
    // Allow console in API routes
    files: ["**/pages/api/**", "**/app/**/route.ts"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintDevConfig;