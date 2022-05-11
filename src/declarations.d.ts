declare module "react-twitter-embed";
declare module "medium-json-feed";
declare module "react-identicons";

// Injected through webpack.DefinePlugin
declare const __VERSION__: string; // App version number
declare const __DATE__: string; // ISO timestamp of build date
declare const __COMMIT__: string; // Short git commit hash

declare module "raw-loader!*.md" {
  const content: string;
  export default content;
}

declare module "extract-dmg" {
  // The included typings for extract-dmg are wrong!!
  // It's actually an async function that needs awaiting so let's fix the typing ourselves.
  declare async function extractDmg(filename: string, destination?: string): Promise<string[]>;
  export default extractDmg;
}
