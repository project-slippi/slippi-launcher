import { addMirrorConfig, startMirroring } from "./ipc";
import { mirrorManager } from "./mirrorManager";

addMirrorConfig.main!.handle(async ({ config }) => {
  mirrorManager.start(config);
  return { success: true };
});

startMirroring.main!.handle(async ({ ip }) => {
  mirrorManager.startMirroring(ip);
  return { success: true };
});
