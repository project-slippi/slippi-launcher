export class Continuation {
  private static separator = ",";

  private constructor(private readonly value: string, private readonly nextIdInclusive: number) {}

  public static fromString(continuation: string | undefined): Continuation | null {
    if (!continuation) {
      return null;
    }

    const parts = decodeFromBase64(continuation).split(Continuation.separator);
    if (parts.length === 2) {
      const value = parts[0];
      const nextIdInclusive = validateId(parts[1]);
      if (nextIdInclusive != null) {
        return new Continuation(value, nextIdInclusive);
      }
    }

    return null;
  }

  public static truncate<U>(
    records: U[],
    limit: number,
    mapper: (item: U) => { value: string; nextIdInclusive: number },
  ): [U[], string | undefined] {
    if (records.length === limit + 1) {
      const lastRecord = records[records.length - 1];
      const { value, nextIdInclusive } = mapper(lastRecord);
      return [records.slice(0, limit), new Continuation(value, nextIdInclusive).toString()];
    }
    return [records, undefined];
  }

  public getValue(): string {
    return this.value;
  }

  public getNextIdInclusive(): number | null {
    return this.nextIdInclusive;
  }

  public toString(): string | undefined {
    if (this.nextIdInclusive != null) {
      const joined = [this.value, this.nextIdInclusive.toString()].join(Continuation.separator);
      return encodeToBase64(joined);
    }
    return undefined;
  }
}

function validateId(val: string): number | null {
  const num = parseInt(val, 10);
  if (Number.isFinite(num) && num >= 0) {
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
