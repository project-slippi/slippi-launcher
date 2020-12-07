const Dotenv = require("dotenv-webpack");

module.exports = function (context) {
  // Add dotenv plugin
  context.plugins.push(new Dotenv());

  return context;
};
