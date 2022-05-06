import { toSvg } from "jdenticon";

export function generateDisplayPicture(text: string, size = 128) {
  const svgString = toSvg(text, size);
  const base64 = window.btoa(svgString);
  return `data:image/svg+xml;base64,${base64}`;
}
