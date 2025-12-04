// vitest.config.ts
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],

  resolve: {
    alias: {
      "@database": path.resolve(__dirname, "src/database"),
      // you can add others if needed:
      // '@renderer': path.resolve(__dirname, 'src/renderer'),
      // '@common': path.resolve(__dirname, 'src/common'),
    },
  },

  test: {
    // Define two projects: renderer (jsdom) and node
    projects: [
      {
        test: {
          name: "renderer",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./.erb/scripts/check-build-exists.ts"],
          testTimeout: 300000,
          include: ["src/renderer/**/*.{test,spec}.{ts,tsx,js,jsx}"],
          exclude: ["release/app/dist", "dist", "node_modules"],
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          globals: true,
          setupFiles: ["./.erb/scripts/check-build-exists.ts"],
          testTimeout: 300000,
          include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}", "!src/renderer/**/*.{test,spec}.{ts,tsx,js,jsx}"],
          exclude: ["release/app/dist", "dist", "node_modules"],
        },
      },
    ],
  },
});
