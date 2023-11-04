type ProcessLike = { argv: string[] };

export class FlagBuilder<Flags extends Record<never, never>> {
  private flags: { [k in keyof Flags]: unknown } = {} as any;
  private overrides: Partial<Record<string, keyof Flags>> = {};
  private readonly argv: string[];

  constructor({ argv }: ProcessLike = process) {
    this.argv = argv;
  }

  public addBooleanFlag<K extends string>(
    name: K,
    value: string | undefined,
    defaultValue: boolean,
  ): FlagBuilder<Flags & { [k in K]: boolean }> {
    (this.flags as any)[name] = parseBooleanFlag(value, defaultValue);
    return this as any;
  }

  public addIntegerFlag<K extends string>(
    name: K,
    value: string | undefined,
    defaultValue: number,
  ): FlagBuilder<Flags & { [k in K]: number }> {
    (this.flags as any)[name] = parseIntegerFlag(value, defaultValue);
    return this as any;
  }

  public withOverride(flagToOverride: keyof Flags, flagName: string) {
    this.overrides[flagName] = flagToOverride;
    return this;
  }

  public build(): Flags {
    const overrides = this.handleFlagOverrides();
    return {
      ...this.flags,
      ...overrides,
    } as Flags;
  }

  private handleFlagOverrides(): Partial<Flags> {
    const flagOverrides: { [k in keyof Flags]: unknown } = {} as any;
    const args = this.argv.slice(1);

    let i = 0;
    while (i < args.length) {
      const argument = args[i];
      const [key, value] = argument.split("=");
      const flagToOverride = this.overrides[key];
      if (flagToOverride) {
        const currentFlagValue = this.flags[flagToOverride];
        switch (typeof currentFlagValue) {
          case "number":
            flagOverrides[flagToOverride] = parseIntegerFlag(value, currentFlagValue);
            break;
          case "boolean":
            if (value) {
              // This allows us to handle something like --someBooleanFlag=false
              flagOverrides[flagToOverride] = parseBooleanFlag(value, currentFlagValue);
            } else {
              flagOverrides[flagToOverride] = true;
            }
            break;
        }
      }
      i += 1;
    }
    return flagOverrides as Partial<Flags>;
  }
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value === "") {
    return defaultValue;
  }

  if (
    value === "0" ||
    value.toLowerCase() === "false" ||
    value.toLowerCase() === "undefined" ||
    value.toLowerCase() === "null"
  ) {
    return false;
  }
  return true;
}

function parseIntegerFlag(value: string | undefined, defaultValue: number): number {
  if (value == null) {
    return defaultValue;
  }
  const parsedNumber = parseInt(value, 10);
  return !isFinite(parsedNumber) ? defaultValue : parsedNumber;
}
