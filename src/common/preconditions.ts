// Based on tiny-invariant
// https://github.com/alexreardon/tiny-invariant/blob/619da0f9119558cd57aeff1ba5d022cad74f9bc7/src/tiny-invariant.ts

export class Preconditions {
  public static checkExists<T>(value: T | null | undefined, message?: string): asserts value is T {
    return this.checkState(value != null, message);
  }

  public static checkState(condition: any, message?: string): asserts condition {
    if (condition) {
      return;
    }

    // The required condition was not satisfied
    throw new Error(message);
  }
}
