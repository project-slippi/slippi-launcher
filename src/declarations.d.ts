declare module "*.svg";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";

declare module "@material-ui/icons/*";
declare module "@material-ui/lab/*";

// This is a globally accessible reference to the static folder
// provided by electron-webpack.
// For more info see: https://webpack.electron.build/using-static-assets
declare const __static: string;
