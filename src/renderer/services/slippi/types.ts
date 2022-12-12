import type { PlayKey } from "@dolphin/types";

export interface UserData {
  playKey: PlayKey | null;
  rulesAccepted: number;
}

export interface SlippiBackendService {
  validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }>;
  fetchUserData(): Promise<UserData | null>;
  assertPlayKey(playKey: PlayKey): Promise<void>;
  deletePlayKey(): Promise<void>;
  changeDisplayName(name: string): Promise<void>;
  acceptRules(): Promise<void>;
  initializeNetplay(codeStart: string): Promise<void>;
}
