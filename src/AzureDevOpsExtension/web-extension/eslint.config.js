const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");

module.exports = [
    // Global ignores
    {
        ignores: [
            "**/node_modules/",
            "**/*.js",
            "**/*.js.map",
            "**/*.d.ts",
            "**/.taskkey",
            "**/reports/",
            "**/.vscode/",
            "**/.idea/",
            "**/.DS_Store",
            "**/Thumbs.db",
            "**/npm-debug.log*",
            "**/yarn-debug.log*",
            "**/yarn-error.log*",
            "tests/test-data/",
            "contents/",
            "bicep-report-extension.ts", // Ignore the old file
        ]
    },
    // Configuration for main TypeScript/TSX files in src
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                project: "./tsconfig.json",
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.es2022,
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
            }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "prefer-const": "warn",
            "no-console": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    },
    // Configuration for test TypeScript files
    {
        files: ["tests/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                project: "./tsconfig.test.json",
            },
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
            }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "prefer-const": "warn",
            "no-console": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    }
];
