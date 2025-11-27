const path = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

// Shared configuration for all projects
const sharedConfig = {
  transform: {
    "\\.(ts|tsx|js|jsx)$": ["ts-jest", { diagnostics: false }],
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/.erb/mocks/fileMock.js",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: path.join("<rootDir>/", compilerOptions.baseUrl) }),
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  moduleDirectories: ["node_modules", "release/app/node_modules"],
  testPathIgnorePatterns: ["release/app/dist"],
  transformIgnorePatterns: ["node_modules/(?!is-ip|ip-regex|super-regex|function-timeout|time-span|convert-hrtime|is-regexp|clone-regexp)"],
};

module.exports = {
  testTimeout: 300000, // 5 minutes in milliseconds
  verbose: true,
  projects: [
    {
      displayName: "renderer",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/renderer/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: ["./.erb/scripts/check-build-exists.ts"],
      ...sharedConfig,
    },
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/src/**/*.{test,spec}.{ts,tsx}",
        "!<rootDir>/src/renderer/**/*.{test,spec}.{ts,tsx}",
      ],
      setupFiles: ["./.erb/scripts/check-build-exists.ts"],
      ...sharedConfig,
    },
  ],
};
