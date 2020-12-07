const pkg = require("./package.json");
const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  // Expose dotenv variables
  context.plugins.push(new Dotenv());

  // Fix refresh not working in react-router-dom
  // For more info: https://stackoverflow.com/a/43212553
  context.output.publicPath = "/";
  context.devServer.historyApiFallback = true;

  // Ensure all dependencies are marked as external.
  // Without this, we randomly get "Invalid hook call" errors.
  context.externals.push(...Object.keys(pkg.dependencies || {}));

  return context;
};
