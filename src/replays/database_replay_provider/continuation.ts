/**
 * Responsible for encoding all necessary continuation information into a string to be sent
 * to the renderer. Typically what's required is at least a composite key (e.g. game start time or
 * last frame as well as a record's unique ID). This makes it possible to return the same search
 * results to continue where we left off.
 *
 * The continuation token is the base64 encoded form of `${value},${nextIdInclusive}`.
 *
 * @param value The start time or last frame of the next record that should be returned
 * @param nextIdInclusive The ID of the next record that should be returned
 */
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

  /**
   * Takes the last element of the list of records to be used as the next value to be returned.
   * The original list of records is truncated to the required size, and the continuation token
   * is generated based on the values in the last record.
   * @param records The list of records returned from the database. Should be of length {@link limit} + 1.
   * @param limit The desired limit of the records
   * @param mapper A function that extracts the required continuation fields from the last record.
   * @returns A tuple with the correctly sized record list, and the encoded continuation token.
   */
  public static truncate<T>(
    records: T[],
    limit: number,
    mapper: (item: T) => { value: string; nextIdInclusive: number },
  ): [T[], string | undefined] {
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

  public getNextIdInclusive(): number {
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
