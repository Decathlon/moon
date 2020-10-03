module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "airbnb",
    "prettier",
    "prettier/react",
    "prettier/@typescript-eslint"
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly"
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: "module"
  },
  plugins: ["react", "@typescript-eslint", "jest"],
  rules: {
    "import/no-extraneous-dependencies": 0,
    "@typescript-eslint/interface-name-prefix": 0,
    "import/no-unresolved": 0,
    "react/jsx-props-no-spreading": 0,
    "@typescript-eslint/ban-ts-ignore": 0,
    "react/jsx-filename-extension": 0,
    "no-shadow": 0,
    "react/prop-types": 0,
    "@typescript-eslint/no-use-before-define": 0,
    "no-use-before-define": 0,
    "react/static-property-placement": 0,
    "no-self-compare": 0,
    "no-restricted-syntax": 0,
    "spaced-comment": 0,
    "@typescript-eslint/triple-slash-reference": 0,
    "import/extensions": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "react/sort-comp": 1,
    "no-restricted-globals": 1,
    "react/no-did-update-set-state": 1,
    radix: 0,
    "react/no-array-index-key": 1,
    camelcase: 1,
    "import/prefer-default-export": 1,
    "no-param-reassign": 1,
    "no-plusplus": 1,
    "no-unused-expressions": 1,
    "jsx-a11y/click-events-have-key-events": 1,
    "jsx-a11y/no-static-element-interactions": 1,
    "max-classes-per-file": 1
  }
};
