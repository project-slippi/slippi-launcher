import styleXPlugin from '@stylexjs/babel-plugin';

const config = {
  presets: [
    "@babel/preset-env",
    ["@babel/preset-typescript", { onlyRemoveTypeImports: true, isTSX: true, allExtensions: true }],
    "@emotion/babel-preset-css-prop"
  ],
  plugins: [
    [
      styleXPlugin,
      {
        dev: true,
        // Set this to true for snapshot testing
        // default: false
        test: false,
        // Required for CSS variable support
        unstable_moduleResolution: {
          // type: 'commonJS' | 'haste'
          // default: 'commonJS'
          type: 'commonJS',
          // The absolute path to the root directory of your project
          rootDir: __dirname,
        },
      },
    ],
  ],
};

export default config;