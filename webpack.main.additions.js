const ThreadsPlugin = require("threads-plugin");
const Dotenv = require("dotenv-webpack");
const webpack = require("webpack");

module.exports = function (context) {
  // Enforce chunkhash when building output files.
  // Without this we get the following error when building workers:
  // Conflict: Multiple assets emit to the same filename: 0.bundle.worker.js
  context.output.chunkFilename = "[id].[chunkhash].js";

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
    new ThreadsPlugin({
      target: "electron-node-worker",
      plugins: [
        new webpack.ExternalsPlugin("commonjs", ["sqlite3"]),
        new webpack.ExternalsPlugin("commonjs", ["sqlite"]),
      ],
    }),
    // Expose dotenv variables
    new Dotenv(),
  );

  return context;
};
