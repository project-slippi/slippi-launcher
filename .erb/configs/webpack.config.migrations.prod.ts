/**
 * Webpack config for production electron main process
 */

import { fdir } from "fdir";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import type { Configuration } from "webpack";
import { merge } from "webpack-merge";

import checkNodeEnv from "../scripts/check-node-env";
import deleteSourceMaps from "../scripts/delete-source-maps";
import baseConfig from "./webpack.config.base";
import webpackPaths from "./webpack.paths";

checkNodeEnv("production");
deleteSourceMaps();

function resolveMigrations(): Record<string, string> {
  const workers: Record<string, string> = {};
  // eslint-disable-next-line new-cap
  const crawler = new fdir().glob("./**/*.ts").withFullPaths();
  const files = crawler.crawl(path.join(webpackPaths.srcPath, "database", "migrations")).sync() as string[];
  files.forEach((filename) => {
    const basename = path.basename(filename, ".ts");
    workers[basename] = filename;
  });
  console.log({ workers });
  return workers;
}

const devtoolsConfig =
  process.env.DEBUG_PROD === "true"
    ? {
        devtool: "source-map",
      }
    : {};

const configuration: Configuration = {
  ...devtoolsConfig,

  mode: "production",

  target: "electron-main",

  entry: resolveMigrations(),

  output: {
    path: path.join(webpackPaths.distPath, "migrations"),
    filename: "[name].js",
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },
};

export default merge(baseConfig, configuration);
