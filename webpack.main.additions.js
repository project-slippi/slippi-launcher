const path = require("path");
const ThreadsPlugin = require("threads-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  context.optimization.minimizer = [];

  context.resolve.modules = [path.resolve(__dirname, "./src"), "node_modules"];

  context.module.rules = context.module.rules.filter((r) => {
    return r.use !== "node-loader";
  });

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

  return context;
};
