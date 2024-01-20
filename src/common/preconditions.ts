import invariant from "tiny-invariant";

export class Preconditions {
  public static checkExists<T>(value: T | null | undefined, message?: string): asserts value is T {
    return this.checkState(value != null, message);
  }

  public static checkState(condition: any, message?: string): asserts condition {
    invariant(condition, message);
  }
}
