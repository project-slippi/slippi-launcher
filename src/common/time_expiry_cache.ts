export class TimeExpiryCache<K, V> {
  private readonly cache: Map<K, { value: V; time: number }> = new Map();

  constructor(private readonly expiresInMs: number) {}

  public get(key: K): V | undefined {
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

  public set(key: K, value: V): this {
    this.cache.set(key, { value, time: Date.now() });
    return this;
  }

  // For completeness
  public clear(): void {
    this.cache.clear();
  }
}
