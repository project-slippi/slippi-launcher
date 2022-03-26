import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import type { StorybookConfig } from "@storybook/core-common";
import path from "path";
import polyfills from "../.erb/configs/webpack.config.renderer.polyfills";
import fs from "fs";
import { merge } from "webpack-merge";
import type { RuleSetRule } from "webpack";

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

const config: StorybookConfig & { babel: any } = {
  stories: ["../src/renderer/**/*.stories.mdx", "../src/renderer/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/preset-scss"],
  framework: "@storybook/react",
  babel: async (options) => {
    options.presets.push("@emotion/babel-preset-css-prop");
    return options;
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

    config = merge(config, polyfills, {
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
    });
    return config;
  },
  core: {
    builder: "webpack5"
  }
};

module.exports = config;
