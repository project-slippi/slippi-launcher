import { rebuild } from "@electron/rebuild";
import fs from "fs";
import path from "path";

import { dependencies } from "../../release/app/package.json";
import webpackPaths from "../configs/webpack.paths";

void (async () => {
  if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(webpackPaths.appNodeModulesPath)) {
    const electronPkgPath = path.join(webpackPaths.rootPath, "node_modules", "electron", "package.json");
    const electronVersion = JSON.parse(fs.readFileSync(electronPkgPath, "utf8")).version;

    await rebuild({
      buildPath: webpackPaths.appPath,
      electronVersion,
      force: true,
      types: ["prod", "dev", "optional"],
    });
  }
})();
