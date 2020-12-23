const pkg = require("./package.json");
const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  // Expose dotenv variables
  context.plugins.push(new Dotenv());

  // Add web worker support. This needs to be processed before the other rules so use unshift.
  context.module.rules.unshift({
    test: /\.worker\.(js|ts)$/i,
    use: [
      {
        loader: "comlink-loader",
        options: {
          singleton: true,
        },
      },
    ],
  });

  // Ensure all dependencies are marked as external.
  // Without this, we randomly get "Invalid hook call" errors.
  context.externals.push(...Object.keys(pkg.dependencies || {}));

  return context;
};
