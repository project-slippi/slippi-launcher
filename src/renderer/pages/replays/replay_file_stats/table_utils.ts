export function groupBy<T>(
  items: T[],
  keyFn: ((item: T) => string | number | undefined) | string,
): Record<string, T[]> {
  const getKey = typeof keyFn === "function" ? keyFn : (item: any) => item[keyFn];
  return items.reduce((acc, item) => {
    const key = String(getKey(item));
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
