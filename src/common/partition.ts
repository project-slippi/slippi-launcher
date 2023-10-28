export function partition<T, U = T>(items: (T | U)[], predicate: (item: T | U, index: number) => boolean): [T[], U[]] {
  const pass: T[] = [];
  const fail: U[] = [];
  items.forEach((item, i) => {
    if (predicate(item, i)) {
      pass.push(item as T);
    } else {
      fail.push(item as U);
    }
  });
  return [pass, fail];
}
