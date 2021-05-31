const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const pkg = require("./package.json");
const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  // Expose dotenv variables
  context.plugins.push(new Dotenv());

  // Ensure our custom paths can be resolved
  context.resolve.plugins = [new TsconfigPathsPlugin()];

  // Ensure all dependencies are marked as external.
  // Without this, we randomly get "Invalid hook call" errors.
  context.externals.push(...Object.keys(pkg.dependencies || {}));

  // Allow importing raw SVGs
  context.module.rules.push({
    test: /\.svg$/,
    use: ["@svgr/webpack", "url-loader"],
  });

  return context;
};
