/**
  React Native Decompiler
  Copyright (C) 2020-2022 Richard Fu, Numan and contributors
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.
  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb-typescript/base',
  ],
  rules: {
    "max-len": ["warn", { code: 180, ignoreComments: true }],
    "no-empty": ["error", { "allowEmptyCatch": true }],
    "no-console": "off",
    "@typescript-eslint/lines-between-class-members": "off",
    "class-methods-use-this": "off",
    "prefer-destructuring": "off",
    "no-param-reassign": ["error", { props: false }],
    "@typescript-eslint/no-empty-function": ['error', {
      allow: [
        'arrowFunctions',
        'functions',
        'methods',
        'private-constructors',
        'protected-constructors',
      ]
    }],
    "@typescript-eslint/no-unused-vars": "off",
  },
};