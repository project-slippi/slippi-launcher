import type { DolphinService } from "@dolphin/types";

export default function createDolphinClient(): DolphinService {
  return window.electron.dolphin;
}
