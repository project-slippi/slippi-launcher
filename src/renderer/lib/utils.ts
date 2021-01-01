import path from "path";
import url from "url";
import { stages as stageUtils } from "@slippi/slippi-js";

const isDevelopment = process.env.NODE_ENV !== "production";

// Fix static folder access in development. For more information see:
// https://github.com/electron-userland/electron-webpack/issues/99#issuecomment-459251702
export const getStatic = (val: string): string => {
  if (isDevelopment) {
    return url.resolve(window.location.origin, val);
  }
  // Escape the backslashes or they won't work as CSS background images
  return path.resolve(path.join(__static, val)).replace(/\\/g, "/");
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

export const getStageImage = (stageId: number): string => {
  const name = stageUtils.getStageName(stageId);
  const imgSrc = getStatic(`/images/stages/${name}.png`);
  return imgSrc;
};
