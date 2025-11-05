/**
 * Build config for electron renderer process
 */

import StylexPlugin from "@stylexjs/webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { I18nextAutoKeyEmitPlugin } from "i18next-auto-keys";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { merge } from "webpack-merge";

import checkNodeEnv from "../scripts/check-node-env";
import deleteSourceMaps from "../scripts/delete-source-maps";
import baseConfig from "./webpack.config.base";
import polyfills from "./webpack.config.renderer.polyfills";
import webpackPaths from "./webpack.paths";

checkNodeEnv("production");
deleteSourceMaps();

const isDevelopment = process.env.NODE_ENV !== "production";

const devtoolsConfig =
  process.env.DEBUG_PROD === "true"
    ? {
        devtool: "source-map",
      }
    : {};

const configuration: webpack.Configuration = {
  ...devtoolsConfig,

  mode: "production",

  target: ["web", "electron-renderer"],

  stats: { assets: true },

  entry: [path.join(webpackPaths.srcRendererPath, "index.tsx")],

  output: {
    path: webpackPaths.distRendererPath,
    publicPath: "./",
    filename: "renderer.js",
    library: {
      type: "umd",
    },
  },

  module: {
    rules: [
      {
        test: /\.s?(a|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
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
        test: /\.s?(a|c)ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
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
      // i18n message files
      {
        test: /\.messages\.(ts|tsx)$/, // Only process message files
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                module: "esnext",
              },
              // Whether or not we should disable type-checking
              transpileOnly: isDevelopment,
              // By default, ts-loader compiles absolutely everything and we don't want that
              onlyCompileBundledFiles: true,
            },
          },
          {
            loader: "i18next-auto-keys",
            options: {
              include: /\.messages\.(ts|tsx)$/, // Only process message files
              hashLength: 10,
            },
          },
        ],
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
      new CssMinimizerPlugin(),
    ],
  },

  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: "production",
      DEBUG_PROD: false,
    }),

    new MiniCssExtractPlugin({
      filename: "style.css",
    }),

    new StylexPlugin({
      dev: isDevelopment,
      unstable_moduleResolution: {
        type: "commonJS",
        rootDir: webpackPaths.rootPath,
      },
      useCSSLayers: true,
      appendTo: "style.css",
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === "true" ? "server" : "disabled",
    }),

    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(webpackPaths.srcRendererPath, "index.ejs"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      isBrowser: false,
      isDevelopment,
    }),

    new I18nextAutoKeyEmitPlugin({
      jsonOutputPath: "locales/en.json",
    }),
  ],
};

export default merge(baseConfig, polyfills, configuration);
