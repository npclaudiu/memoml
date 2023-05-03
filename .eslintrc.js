/* eslint-env node */
module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:@typescript-eslint/strict',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    plugins: [
        '@typescript-eslint',
    ],
    env: {
        es6: true,
        node: true,
    },
    root: true,
    rules: {
        "@typescript-eslint/restrict-template-expressions": ["error", {
            allowNumber: true,
            allowBoolean: true,
        }],
    },
    "ignorePatterns": ["*.js", "*.d.ts", "*.test.ts"],
};
