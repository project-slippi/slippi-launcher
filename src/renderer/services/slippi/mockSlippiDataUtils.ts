export function generateMockChatMessage(count: number, isPaid = false) {
  const messages: { text: string; isPaid: boolean }[] = [];
  for (let i = 1; i <= count; i++) {
    messages.push({ text: `${isPaid ? "Paid" : "Free"} message ${i}`, isPaid });
  }
  return messages;
}

export function generateUserSubscriptionLevel(isSub?: boolean): string {
  return isSub ? "TIER1" : "NONE";
}
