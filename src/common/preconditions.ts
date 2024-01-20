import invariant from "tiny-invariant";

export class Preconditions {
  public static checkExists<T>(value: T | null | undefined, message?: string): asserts value is T {
    invariant(value != null, message);
  }
}
