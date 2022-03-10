
module.exports = {
  env: {
    // "browser": true,
    // "es6": true,
    // "node": true
  },
  extends: [
    `plugin:vue/essential`,
    `standard`,
  ],
  globals: {
    Atomics: `readonly`,
    SharedArrayBuffer: `readonly`,
  },
  plugins: [
    `html`,
    `import`,
    `node`,
    `promise`,
    `vue`,
  ],
  rules: {
    quotes: [1, `backtick`],
    "comma-dangle": [`error`, `always-multiline`],
  },
  parser: `vue-eslint-parser`,
  parserOptions: {
    parser: `babel-eslint`,
    sourceType: `module`,
  },
}
