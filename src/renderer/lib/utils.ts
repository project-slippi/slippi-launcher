import * as path from "path";
import * as url from "url";

import { remote } from "electron";

const isDevelopment = process.env.NODE_ENV !== "production";

// see https://github.com/electron-userland/electron-webpack/issues/99#issuecomment-459251702
export const getStatic = (val: string): string => {
  if (isDevelopment) {
    return url.resolve(window.location.origin, val);
  }
  const appPath = remote.app.getAppPath();
  const imagePath = path.join(appPath, "../static");
  return path.resolve(path.join(imagePath, val));
};

export const getCharacterIcon = (
  characterId: number,
  characterColor = 0
): string => {
  const imgSrc = getStatic(
    `/images/characters/${characterId}/${characterColor}/stock.png`
  );
  return imgSrc;
};
