import path from "path";
import fs from "fs";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import chalk from "chalk";
import { merge } from "webpack-merge";
import { spawn, execSync } from "child_process";
import baseConfig from "./webpack.config.base";
import webpackPaths from "./webpack.paths";
import checkNodeEnv from "../scripts/check-node-env";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

// We need to import dotenv here in order to for env variables to be passed into our development main process.
import "dotenv/config";

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === "production") {
  checkNodeEnv("development");
}

const port = process.env.PORT || 1212;
const manifest = path.resolve(webpackPaths.dllPath, "renderer.json");
const requiredByDLLConfig = module.parent!.filename.includes("webpack.config.renderer.dev.dll");

/**
 * Warn if the DLL is not built
 */
if (!requiredByDLLConfig && !(fs.existsSync(webpackPaths.dllPath) && fs.existsSync(manifest))) {
  console.log(
    chalk.black.bgYellow.bold(
      'The DLL files are missing. Sit back while we build them for you with "yarn run build-dll"',
    ),
  );
  execSync("yarn run postinstall");
}

const configuration: webpack.Configuration = {
  devtool: "inline-source-map",

  mode: "development",

  target: ["web", "electron-renderer"],

  entry: [
    `webpack-dev-server/client?http://localhost:${port}/dist`,
    "webpack/hot/only-dev-server",
    path.join(webpackPaths.srcRendererPath, "index.tsx"),
  ],

  output: {
    path: webpackPaths.distRendererPath,
    publicPath: "/",
    filename: "renderer.dev.js",
    library: {
      type: "umd",
    },
  },

  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
            },
          },
          "sass-loader",
        ],
        include: /\.module\.s?(c|a)ss$/,
      },
      {
        test: /\.s?css$/,
        use: ["style-loader", "css-loader", "sass-loader"],
        exclude: /\.module\.s?(c|a)ss$/,
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      // Allow direct importing of SVGs
      {
        test: /\.svg$/,
        use: ["@svgr/webpack", "url-loader"],
      },
      // Images
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },

  resolve: {
    fallback: {
      net: false,
      dgram: false,
      fs: false,
    },
  },

  plugins: [
    ...(requiredByDLLConfig
      ? []
      : [
          new webpack.DllReferencePlugin({
            context: webpackPaths.dllPath,
            manifest: require(manifest),
            sourceType: "var",
          }),
        ]),

    new webpack.NoEmitOnErrorsPlugin(),
    new NodePolyfillPlugin(),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: "development",
    }),

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),

    new ReactRefreshWebpackPlugin(),

    new HtmlWebpackPlugin({
      filename: path.join("index.html"),
      template: path.join(webpackPaths.srcRendererPath, "index.ejs"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      isBrowser: false,
      env: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV !== "production",
      nodeModules: webpackPaths.appNodeModulesPath,
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  // @ts-ignore
  devServer: {
    port,
    compress: true,
    hot: true,
    headers: { "Access-Control-Allow-Origin": "*" },
    static: {
      publicPath: "/",
      directory: path.join(webpackPaths.rootPath, "assets"),
    },
    historyApiFallback: {
      verbose: true,
    },
    onBeforeSetupMiddleware() {
      console.log("Starting Main Process...");
      spawn("yarn", ["run", "start:main"], {
        shell: true,
        env: process.env,
        stdio: "inherit",
      })
        .on("close", (code: number) => process.exit(code!))
        .on("error", (spawnError) => console.error(spawnError));
    },
  },
};

export default merge(baseConfig, configuration);
