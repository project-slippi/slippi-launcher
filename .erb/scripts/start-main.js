// Entry point to start the main process with ts-node support
// This ensures ts-node is loaded before trying to import TypeScript files

// Load environment variables
require("dotenv/config");

// Register tsconfig-paths for path aliases
require("tsconfig-paths/register");

// Fix ESM imports
require("./fix-esm.js");

// Register ts-node with transpile-only mode
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
  },
});

// Now we can require the TypeScript main file
require("../../src/main/main.ts");
