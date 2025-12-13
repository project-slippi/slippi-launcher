import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";
import fs from "fs";
import { merge } from "webpack-merge";
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

    config = merge(config, {
      resolve: {
        alias: {
          "@emotion/core": getPackageDir("@emotion/react"),
          "@emotion/styled": getPackageDir("@emotion/styled"),
          "emotion-theming": getPackageDir("@emotion/react")
        },
        plugins: [
          new TsconfigPathsPlugin({
            extensions: config.resolve.extensions
          }) as any
        ],
      },
      plugins: [
        ...(config.plugins || []),
        new webpack.ProvidePlugin({
          React: 'react',
        }),
      ],
    });
    return config;
  },
};

module.exports = config;
