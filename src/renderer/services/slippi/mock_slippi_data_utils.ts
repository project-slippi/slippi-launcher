import type { SubscriptionResult } from "./graphql_endpoints";

export function generateMockChatMessage(count: number, isPaid = false) {
  const messages: { text: string; isPaid: boolean }[] = [];
  for (let i = 1; i <= count; i++) {
    messages.push({ text: `${isPaid ? "Paid" : "Free"} message ${i}`, isPaid });
  }
  return messages;
}

export function generateUserSubscriptionLevel(isSub?: boolean): SubscriptionResult {
  return isSub ? { level: "TIER1", hasGiftSub: false } : { level: "NONE", hasGiftSub: false };
}
