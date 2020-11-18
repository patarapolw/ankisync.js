module.exports = {
  env: {
    es2020: true,
    node: true
  },
  extends: ['standard'],
  globals: {
    NodeJS: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'space-before-function-paren': 0
  }
}
