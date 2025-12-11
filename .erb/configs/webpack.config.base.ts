/**
 * Base webpack config used across other specific configs
 */

import { execSync } from "child_process";
import Dotenv from "dotenv-webpack";
import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import webpack from "webpack";

import pkg from "../../release/app/package.json";
import webpackPaths from "./webpack.paths";

const isDevelop = process.env.NODE_ENV === "development";
const buildDate = new Date().toISOString();
const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

const configuration: webpack.Configuration = {
  externals: [...Object.keys(pkg.dependencies || {})],

  stats: "errors-only",

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        loader: "esbuild-loader",
        options: {
          target: "esnext",
        },
      },
      // i18n message files
      {
        test: /\.messages\.(ts|tsx)$/, // Only process message files
        exclude: /node_modules/,
        enforce: "pre",
        use: {
          loader: "i18next-auto-keys",
          options: {
            setDefaultValue: isDevelop,
            debug: process.env.DEBUG_I18N === "1",
          },
        },
      },
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: "commonjs2",
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
    modules: [webpackPaths.srcPath, "node_modules"],
    // There is no need to add aliases here, the paths in tsconfig get mirrored
    plugins: [new TsconfigPathsPlugin()],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: "production",

      // Environment Variables to expose in the renderer process
      DEBUG_I18N: null,
      ENABLE_REPLAY_DATABASE: null,
    }),

    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(pkg.version),
      __DATE__: JSON.stringify(buildDate),
      __COMMIT__: JSON.stringify(commitHash),
    }),

    new Dotenv({
      path: path.join(webpackPaths.rootPath, ".env"),
      silent: true,
    }),
  ],
};

export default configuration;
