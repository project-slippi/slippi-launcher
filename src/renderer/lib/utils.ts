import path from "path";
import url from "url";

const isDevelopment = process.env.NODE_ENV !== "production";

// Fix static folder access in development. For more information see:
// https://github.com/electron-userland/electron-webpack/issues/99#issuecomment-459251702
export const getStatic = (val: string): string => {
  if (isDevelopment) {
    return url.resolve(window.location.origin, val);
  }
  return path.resolve(path.join(__static, val));
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
