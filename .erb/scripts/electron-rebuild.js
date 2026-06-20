import { rebuild } from "@electron/rebuild";
import fs from "fs";

import { dependencies } from "../../release/app/package.json";
import webpackPaths from "../configs/webpack.paths";

void (async () => {
  if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(webpackPaths.appNodeModulesPath)) {
    await rebuild({
      buildPath: webpackPaths.appPath,
      force: true,
      types: ["prod", "dev", "optional"],
    });
  }
})();
