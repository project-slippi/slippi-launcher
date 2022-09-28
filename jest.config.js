const path = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

module.exports = {
  roots: ["<rootDir>/src"],
  testTimeout: 300000, // 5 minutes in milliseconds
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  verbose: true,
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
  testURL: "http://localhost/",
  testEnvironment: "jsdom",
  transform: {
    "\\.(ts|tsx|js|jsx)$": "ts-jest",
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
  setupFiles: ["./.erb/scripts/check-build-exists.ts"],
  transformIgnorePatterns: ["node_modules/(?!is-ip|ip-regex|super-regex|function-timeout|time-span|convert-hrtime|is-regexp|clone-regexp)"],
};
