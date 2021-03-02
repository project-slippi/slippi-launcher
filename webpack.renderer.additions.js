const pkg = require("./package.json");
const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  // Expose dotenv variables
  context.plugins.push(new Dotenv());

  // Ensure all dependencies are marked as external.
  // Without this, we randomly get "Invalid hook call" errors.
  context.externals.push(...Object.keys(pkg.dependencies || {}));

  // Ignore conflicting SVG rules
  context.module.rules = context.module.rules.filter((rule) => !rule.test.toString().includes("svg"));

  // Allow importing raw SVGs
  context.module.rules.push({
    test: /\.svg$/,
    use: ["@svgr/webpack", "url-loader"],
  });

  return context;
};
