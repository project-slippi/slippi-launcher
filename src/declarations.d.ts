declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";

declare module "react-identicons";
declare module "medium-json-feed";
declare module "@material-ui/icons/*";
declare module "@material-ui/lab/*";

// This is a globally accessible reference to the static folder
// provided by electron-webpack.
// For more info see: https://webpack.electron.build/using-static-assets
declare const __static: string;

// Injected through webpack.renderer.additions.js
declare const __VERSION__: string; // App version number
declare const __DATE__: string; // ISO timestamp of build date
declare const __COMMIT__: string; // Short git commit hash
