import js from '@eslint/js'
import checkFile from 'eslint-plugin-check-file'
import importPlugin from 'eslint-plugin-import'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/__tests__/**',
  ]),
  {
    ignores: ['dist'],
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      sonarjs.configs.recommended,
      eslintPluginPrettierRecommended,
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'check-file': checkFile,
      import: importPlugin,
    },
    rules: {
      'valid-typeof': ['error', { requireStringLiterals: true }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      'no-empty-function': 'error',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'no-continue': 'error',
      'default-case-last': 'error',
      'no-return-await': 'error',
      'no-template-curly-in-string': 'error',
      'no-control-regex': 'error',
      'require-unicode-regexp': 'warn',
      'array-callback-return': ['error', { allowImplicit: false }],
      complexity: ['warn', 15],
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/cyclomatic-complexity': [
        'error',
        {
          threshold: 15,
        },
      ],
      'react/prop-types': 'off',
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/components/*/': 'CAMEL_CASE',
          'src/!(components)/**/!(__tests__)/': 'CAMEL_CASE',
        },
      ],
      'prefer-const': 'error',
      'no-const-assign': 'error',
      'no-var': 'error',
      'prefer-destructuring': 'warn',
      'default-param-last': 'error',
      'no-duplicate-imports': 'error',
      'import/first': 'error',
      'import/extensions': 'error',
      'operator-linebreak': 'error',
      'no-use-before-define': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'id-length': ['error', { min: 2 }],
    },
  },
])
