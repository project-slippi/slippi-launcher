import type { PlayKey } from "@dolphin/types";

export type AvailableMessageType = {
  text: string;
  isPaid: boolean;
};

export type SubscriptionLevel = "NONE" | "TIER1" | "TIER2" | "TIER3";

export const enum Rank {
  NONE = "none",
  BANNED = "banned",
  PENDING = "pending",
  BRONZE1 = "bronze1",
  BRONZE2 = "bronze2",
  BRONZE3 = "bronze3",
  SILVER1 = "silver1",
  SILVER2 = "silver2",
  SILVER3 = "silver3",
  GOLD1 = "gold1",
  GOLD2 = "gold2",
  GOLD3 = "gold3",
  PLAT1 = "plat1",
  PLAT2 = "plat2",
  PLAT3 = "plat3",
  DIAMOND1 = "diamond1",
  DIAMOND2 = "diamond2",
  DIAMOND3 = "diamond3",
  MASTER1 = "master1",
  MASTER2 = "master2",
  MASTER3 = "master3",
  GRANDMASTER = "grandmaster",
}

export type RankedProfile = {
  rating: number;
  rank: Rank;
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
  fetchRankedNetplayProfile(userId: string): Promise<RankedProfile | undefined>;
  assertPlayKey(playKey: PlayKey): Promise<void>;
  deletePlayKey(): Promise<void>;
  changeDisplayName(name: string): Promise<void>;
  acceptRules(): Promise<void>;
  initializeNetplay(codeStart: string): Promise<void>;
  fetchChatMessageData(userId: string): Promise<ChatMessageData>;
  submitChatMessages(uid: string, messages: string[]): Promise<string[]>;
}
