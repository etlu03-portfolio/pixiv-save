module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  extends: ['prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-len': [
      'warn',
      {
        code: 80,
        tabWidth: 2,
      },
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
      },
    ],
    'no-console': 'off',
    'no-plusplus': 'off',
  },
};
