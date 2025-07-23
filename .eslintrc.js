module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    // Disable semicolons as per user rules
    'semi': ['error', 'never'],
    '@typescript-eslint/semi': ['error', 'never'],
    
    // Code style preferences
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'comma-dangle': ['error', 'never'],
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General best practices
    'no-console': 'off', // Allow console for logging
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error'
  },
  env: {
    node: true,
    es2022: true
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js'
  ]
} 