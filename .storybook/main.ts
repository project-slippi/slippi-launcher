import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";
import fs from "fs";
import type { RuleSetRule } from "webpack";
import webpack from "webpack";

// Helper for fixing emotion dependency
// Taken from: https://stackoverflow.com/a/65970945
function getPackageDir(filepath: string) {
  let currDir = path.dirname(require.resolve(filepath));
  while (true) {
    if (fs.existsSync(path.join(currDir, "package.json"))) {
      return currDir;
    }
    const { dir, root } = path.parse(currDir);
    if (dir === root) {
      throw new Error(`Could not find package.json in the parent directories starting from ${filepath}.`);
    }
    currDir = dir;
  }
}

const config: StorybookConfig = {
  stories: ["../src/renderer/**/*.stories.mdx", "../src/renderer/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/preset-scss",
    "@storybook/addon-webpack5-compiler-babel",
    "@storybook/addon-docs"
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      builder: {},
    },
  },
  babel: async (options) => {
    return {
      ...options,
      presets: [
        ...(options.presets || []),
        ["@babel/preset-typescript", {
          isTSX: true,
          allExtensions: true,
          onlyRemoveTypeImports: true
        }],
        "@emotion/babel-preset-css-prop",
      ],
    };
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    check: false,
  },
  webpackFinal: async config => {
    // Fix SVGR not working
    // Taken from: https://github.com/storybookjs/storybook/issues/6188#issuecomment-654884130
    const fileLoaderRule = config.module.rules.find(
      (rule: any) => !Array.isArray(rule.test) && rule.test.test(".svg"),
    ) as RuleSetRule;
    fileLoaderRule.exclude = /\.svg$/;
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack", "url-loader"],
    });

    // Merge resolve configuration separately to avoid plugin duplication
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@emotion/core": getPackageDir("@emotion/react"),
      "@emotion/styled": getPackageDir("@emotion/styled"),
      "emotion-theming": getPackageDir("@emotion/react")
    };

    // Add TsconfigPathsPlugin if not already present
    config.resolve.plugins = config.resolve.plugins || [];
    const hasTsconfigPlugin = config.resolve.plugins.some(
      (plugin: any) => plugin?.constructor?.name === 'TsconfigPathsPlugin'
    );
    if (!hasTsconfigPlugin) {
      config.resolve.plugins.push(
        new TsconfigPathsPlugin({
          extensions: config.resolve.extensions
        }) as any
      );
    }

    // Add ProvidePlugin if not already present
    config.plugins = config.plugins || [];
    const hasProvidePlugin = config.plugins.some(
      (plugin: any) => plugin?.constructor?.name === 'ProvidePlugin'
    );
    if (!hasProvidePlugin) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          React: 'react',
        })
      );
    }

    return config;
  },
};

module.exports = config;
