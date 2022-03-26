/**
 * Base build config for electron renderer process
 */

import webpack from "webpack";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const polyfills: webpack.Configuration = {
  resolve: {
    alias: {
      net: false,
      dgram: false,
      fs: false,
      enet: false,
    },
  },

  plugins: [
    new NodePolyfillPlugin(),
  ],
};

export default polyfills;
