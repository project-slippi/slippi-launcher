export class Continuation {
  private static separator = ",";

  private constructor(private readonly startTime: string | null, private readonly nextIdInclusive: number) {}

  public static fromString(continuation: string | undefined): Continuation | null {
    if (!continuation) {
      return null;
    }

    const parts = decodeFromBase64(continuation).split(Continuation.separator);
    if (parts.length === 2) {
      const startTime = parts[0] === "null" ? null : validateISOString(parts[0]);
      const nextIdInclusive = validateId(parts[1]);
      if (nextIdInclusive != null) {
        return new Continuation(startTime, nextIdInclusive);
      }
    }

    return null;
  }

  public static truncate<T>(
    records: T[],
    limit: number,
    mapper: (item: T) => { startTime: string | null; nextIdInclusive: number },
  ): [T[], string | undefined] {
    if (records.length === limit + 1) {
      const lastRecord = records[records.length - 1];
      const { startTime, nextIdInclusive } = mapper(lastRecord);
      return [records.slice(limit), new Continuation(startTime, nextIdInclusive).toString()];
    }
    return [records, undefined];
  }

  public getStartTime(): string | null {
    return this.startTime;
  }

  public getNextIdInclusive(): number | null {
    return this.nextIdInclusive;
  }

  public toString(): string | undefined {
    if (this.nextIdInclusive != null) {
      const joined = [this.startTime ?? "null", this.nextIdInclusive.toString()].join(Continuation.separator);
      return encodeToBase64(joined);
    }
    return undefined;
  }
}

function validateISOString(val: string): string | null {
  const date = new Date(val);
  if (!Number.isNaN(date.valueOf()) && date.toISOString() === val) {
    return val;
  }
  return null;
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
