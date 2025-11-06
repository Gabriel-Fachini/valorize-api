import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist']
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {},
    rules: {
      // === STYLE AND FORMATTING ===
      'semi': ['error', 'never'], // Remove semicolons at the end of lines
      'quotes': ['error', 'single'], // Force single quotes instead of double quotes
      'comma-dangle': ['error', 'always-multiline'], // Trailing comma in multiline objects/arrays
      'object-curly-spacing': ['error', 'always'], // Spaces inside braces { example }
      'array-bracket-spacing': ['error', 'never'], // No spaces inside brackets [example]
      'comma-spacing': ['error', { before: false, after: true }], // Space after commas
      'key-spacing': ['error', { beforeColon: false, afterColon: true }], // Spacing in objects
      'space-before-blocks': ['error', 'always'], // Space before blocks if () {}
      'keyword-spacing': ['error', { before: true, after: true }], // Space around keywords

      // === CODE QUALITY ===
      'no-unused-vars': 'off', // Disable JS rule (conflicts with TypeScript)
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', // Ignore arguments starting with _
        varsIgnorePattern: '^_' // Ignore variables starting with _
      }],
      'no-console': ['warn'], // Warn about console.log (should be removed in production)
      'no-debugger': 'error', // Prohibit debugger statements
      'no-duplicate-imports': 'error', // Prohibit duplicate imports
      'prefer-const': 'error', // Prefer const when variable is not reassigned
      'no-var': 'error', // Prohibit var, force let/const
      'eqeqeq': ['error', 'always'], // Force === instead of ==

      // === TYPESCRIPT SPECIFIC ===
      '@typescript-eslint/explicit-function-return-type': 'off', // Don't require return type on functions
      '@typescript-eslint/no-explicit-any': 'warn', // Warn about 'any' usage
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignoreConditionalTests: false, ignoreMixedLogicalExpressions: false }], // Prefer ?? instead of ||
      '@typescript-eslint/prefer-optional-chain': 'error', // Prefer optional chaining obj?.prop
    },
  },
)