/**
 * Base build config for electron renderer process
 */

import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import type webpack from "webpack";

const polyfills: webpack.Configuration = {
  resolve: {
    alias: {
      net: false,
      dgram: false,
      fs: false,
      enet: false,
    },
  },

  plugins: [new NodePolyfillPlugin()],
};

export default polyfills;
