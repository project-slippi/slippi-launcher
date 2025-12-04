// vitest.config.ts
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Define two projects: renderer (jsdom) and node
    projects: [
      {
        plugins: [tsconfigPaths()],

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
        plugins: [tsconfigPaths()],

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
