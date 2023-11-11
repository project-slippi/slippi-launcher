export class Continuation {
  private static separator = ",";

  private constructor(private readonly continuationValue: string, private readonly nextIdInclusive: number) {}

  public static fromString(continuation: string | undefined): Continuation | null {
    if (!continuation) {
      return null;
    }

    const parts = decodeFromBase64(continuation).split(Continuation.separator);
    if (parts.length === 2) {
      const continuationValue = parts[0];
      const nextIdInclusive = validateId(parts[1]);
      if (nextIdInclusive != null) {
        return new Continuation(continuationValue, nextIdInclusive);
      }
    }

    return null;
  }

  public static truncate<U>(
    records: U[],
    limit: number,
    mapper: (item: U) => { continuationValue: string; nextIdInclusive: number },
  ): [U[], string | undefined] {
    if (records.length === limit + 1) {
      const lastRecord = records[records.length - 1];
      const { continuationValue, nextIdInclusive } = mapper(lastRecord);
      return [records.slice(0, limit), new Continuation(continuationValue, nextIdInclusive).toString()];
    }
    return [records, undefined];
  }

  public getContinuationValue(): string {
    return this.continuationValue;
  }

  public getNextIdInclusive(): number | null {
    return this.nextIdInclusive;
  }

  public toString(): string | undefined {
    if (this.nextIdInclusive != null) {
      const joined = [this.continuationValue, this.nextIdInclusive.toString()].join(Continuation.separator);
      return encodeToBase64(joined);
    }
    return undefined;
  }
}

function validateId(val: string): number | null {
  const num = parseInt(val, 10);
  if (Number.isFinite(num)) {
    return num;
  }
  return null;
}

function encodeToBase64(val: string): string {
  return Buffer.from(val).toString("base64");
}

function decodeFromBase64(val: string): string {
  return Buffer.from(val, "base64").toString();
}
