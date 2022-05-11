/**
 * Builds the DLL for development electron renderer process
 */

import path from "path";
import webpack from "webpack";
import { merge } from "webpack-merge";

import { dependencies } from "../../package.json";
import checkNodeEnv from "../scripts/check-node-env";
import baseConfig from "./webpack.config.base";
import webpackConfig from "./webpack.config.renderer.dev";
import webpackPaths from "./webpack.paths";

checkNodeEnv("development");

const dist = webpackPaths.dllPath;

// For some reason firebase has issues with ERB and it gives a weird "Package path . is not exported" error.
// So we're just gonna ignore it for now and hope it's okay.
const depsToIgnore = ["firebase"];

export default (env: any, argv: any) => {
  const rendererDevConfig = webpackConfig(env, argv);

  const configuration: webpack.Configuration = {
    context: webpackPaths.rootPath,

    devtool: "eval",

    mode: "development",

    target: "electron-renderer",

    externals: ["fsevents", "crypto-browserify"],

    /**
     * Use `module` from `webpack.config.renderer.dev.js`
     */
    module: rendererDevConfig.module,

    entry: {
      renderer: Object.keys(dependencies || {}).filter((dep) => !depsToIgnore.includes(dep)),
    },

    output: {
      path: dist,
      filename: "[name].dev.dll.js",
      library: {
        name: "renderer",
        type: "var",
      },
    },

    plugins: [
      new webpack.DllPlugin({
        path: path.join(dist, "[name].json"),
        name: "[name]",
      }),

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
        NODE_ENV: "development",
      }),

      new webpack.LoaderOptionsPlugin({
        debug: true,
        options: {
          context: webpackPaths.srcPath,
          output: {
            path: webpackPaths.dllPath,
          },
        },
      }),
    ],
  };

  return merge(baseConfig, configuration);
};
