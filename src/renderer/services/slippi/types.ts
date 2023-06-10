import type { PlayKey } from "@dolphin/types";

export type AvailableMessageType = {
  text: string;
  isPaid: boolean;
};

export type UserData = {
  playKey: PlayKey | null;
  rulesAccepted: number;
};

export type ChatMessageData = {
  level: string;
  availableMessages: AvailableMessageType[];
  userMessages: string[];
};

export interface SlippiBackendService {
  validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }>;
  fetchUserData(): Promise<UserData | null>;
  assertPlayKey(playKey: PlayKey): Promise<void>;
  deletePlayKey(): Promise<void>;
  changeDisplayName(name: string): Promise<void>;
  acceptRules(): Promise<void>;
  initializeNetplay(codeStart: string): Promise<void>;
  fetchChatMessageData(userId: string): Promise<ChatMessageData>;
  submitChatMessages(uid: string, messages: string[]): Promise<string[]>;
}
