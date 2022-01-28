const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const ThreadsPlugin = require("threads-plugin");
const Dotenv = require("dotenv-webpack");
const { DefinePlugin } = require("webpack");
const pkg = require("./package.json");

module.exports = function (context) {
  // Enforce chunkhash when building output files.
  // Without this we get the following error when building workers:
  // Conflict: Multiple assets emit to the same filename: 0.bundle.worker.js
  context.output.chunkFilename = "[id].[chunkhash].js";

  // Ensure our custom paths can be resolved
  context.resolve.plugins = [new TsconfigPathsPlugin()];

  context.module.rules.unshift({
    test: /\.node$/,
    use: {
      loader: "native-ext-loader",
      options: {
        rewritePath: undefined,
        name: "[path][name].[ext]",
      },
    },
  });

  context.plugins.unshift(
    // Add threads worker support
    new ThreadsPlugin({ target: "electron-node-worker" }),
    // Expose dotenv variables
    new Dotenv(),
  );

  context.plugins.push(
    new DefinePlugin({
      __VERSION__: JSON.stringify(pkg.version),
    }),
  );

  return context;
};
