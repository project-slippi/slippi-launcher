export function groupBy<T>(items: T[], keyFn: (item: T) => string | number | undefined): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = String(keyFn(item));
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
