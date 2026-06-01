export class TimeExpiryCache<K, V> {
  private readonly cache: Map<K, { value: V; time: number }> = new Map();

  constructor(private readonly expiresInMs: number) {}

  get(key: K): V | undefined {
    const cachedValue = this.cache.get(key);
    if (cachedValue) {
      const elapsedMs = Date.now() - cachedValue.time;
      if (elapsedMs <= this.expiresInMs) {
        return cachedValue.value;
      } else {
        this.cache.delete(key);
      }
    }
    return undefined;
  }

  set(key: K, value: V): this {
    this.cache.set(key, { value, time: Date.now() });
    return this;
  }

  // For completeness
  clear(): void {
    this.cache.clear();
  }
}
