module.exports = {
  roots: ["<rootDir>/src"],
  testTimeout: 300000, // 5 minutes in milliseconds
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  verbose: true,
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
};
