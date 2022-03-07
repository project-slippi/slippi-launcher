/**
 * Webpack config for production electron main process
 */

import path from "path";
import webpack from "webpack";
import { merge } from "webpack-merge";
import TerserPlugin from "terser-webpack-plugin";
import baseConfig from "./webpack.config.base";
import webpackPaths from "./webpack.paths";

const isDevelop = process.env.NODE_ENV === "development";

const devtoolsConfig =
  process.env.DEBUG_PROD === "true"
    ? {
        devtool: "source-map",
      }
    : {};

const configuration: webpack.Configuration = {
  ...devtoolsConfig,

  mode: isDevelop ? "development" : "production",

  target: "electron-preload",

  entry: {
    preload: path.join(webpackPaths.srcMainPath, "preload.ts"),
  },

  output: {
    path: isDevelop ? webpackPaths.srcMainPath : webpackPaths.distMainPath,
    filename: "[name].js",
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },

  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: isDevelop ? "development" : "production",
      DEBUG_PROD: false,
      START_MINIMIZED: false,
    }),
  ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
};

export default merge(baseConfig, configuration);
