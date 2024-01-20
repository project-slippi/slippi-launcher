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
