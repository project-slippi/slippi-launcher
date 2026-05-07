import type { PlayKey } from "@dolphin/types";

export type AvailableMessageType = {
  text: string;
  isPaid: boolean;
};

export type SubscriptionLevel = "NONE" | "TIER1" | "TIER2" | "TIER3";

export type RankedProfile = {
  rating: number;
  hasPlacement: boolean;
  setsPlayed: number;
};

export type UserData = {
  playKey: PlayKey | undefined;
  rulesAccepted: number;
  activeSubscriptionLevel: SubscriptionLevel;
  rankedNetplayProfile: RankedProfile | undefined;
};

export type ChatMessageData = {
  availableMessages: AvailableMessageType[];
  userMessages: string[];
};

export interface SlippiBackendService {
  validateUserId(userId: string): Promise<{ displayName: string; connectCode: string }>;
  fetchUserData(): Promise<UserData | undefined>;
  assertPlayKey(playKey: PlayKey): Promise<void>;
  deletePlayKey(): Promise<void>;
  changeDisplayName(name: string): Promise<void>;
  acceptRules(): Promise<void>;
  initializeNetplay(codeStart: string): Promise<void>;
  fetchChatMessageData(userId: string): Promise<ChatMessageData>;
  submitChatMessages(uid: string, messages: string[]): Promise<string[]>;
}
