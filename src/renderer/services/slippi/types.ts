import type { PlayKey } from "@dolphin/types";

export interface SlippiBackendService {
  validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }>;
  fetchPlayKey(): Promise<PlayKey | null>;
  assertPlayKey(playKey: PlayKey): Promise<void>;
  deletePlayKey(): Promise<void>;
  changeDisplayName(name: string): Promise<void>;
  initializeNetplay(codeStart: string): Promise<void>;
}
