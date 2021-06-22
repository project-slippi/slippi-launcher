const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const pkg = require("./package.json");
const Dotenv = require("dotenv-webpack");
const { DefinePlugin } = require("webpack");

const moment = require("moment");

const buildDate = moment().toISOString();
const commitHash = require("child_process").execSync("git rev-parse --short HEAD").toString().trim();

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

  // Add global definitions
  context.plugins.push(
    new DefinePlugin({
      __VERSION__: JSON.stringify(pkg.version),
      __DATE__: JSON.stringify(buildDate),
      __COMMIT__: JSON.stringify(commitHash),
    }),
  );

  return context;
};
