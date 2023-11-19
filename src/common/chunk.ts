export function chunk<T>(items: readonly T[], chunkSize = 1): T[][] {
  if (chunkSize <= 0) {
    return [];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}
