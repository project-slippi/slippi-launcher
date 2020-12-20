const pkg = require("./package.json");
const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  // Expose dotenv variables
  context.plugins.push(new Dotenv());

  // Ensure all dependencies are marked as external.
  // Without this, we randomly get "Invalid hook call" errors.
  context.externals.push(...Object.keys(pkg.dependencies || {}));

  return context;
};
