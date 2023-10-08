export type ConfigFlags = {
  enableMainlineDolphin: boolean;
  enableReplayDatabase: boolean;
};

export enum RuntimeFlags {
  ENABLE_MAINLINE_DOLPHIN = "--enable-mainline-dolphin",
  ENABLE_REPLAY_DATABASE = "--enable-replay-database",
}

const DEVELOPMENT_CONFIG_FLAGS: ConfigFlags = {
  enableMainlineDolphin: true,
  enableReplayDatabase: true,
};

export function getConfigFlags(): ConfigFlags {
  const isDevelopment = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";
  if (isDevelopment) {
    return DEVELOPMENT_CONFIG_FLAGS;
  }

  const buildFlags = getBuildFlags();
  const runtimeFlags = getRuntimeFlags();

  return {
    ...buildFlags,
    ...runtimeFlags,
  };
}

function getBuildFlags(): ConfigFlags {
  return {
    enableMainlineDolphin: parseBoolean(process.env.ENABLE_MAINLINE_DOLPHIN, false),
    enableReplayDatabase: parseBoolean(process.env.ENABLE_REPLAY_DATABASE, false),
  };
}

function getRuntimeFlags(): Partial<ConfigFlags> {
  const overrides: Partial<ConfigFlags> = {};
  const args = process.argv.slice(1);

  let i = 0;
  while (i < args.length) {
    const argument = args[i];
    switch (argument) {
      case RuntimeFlags.ENABLE_MAINLINE_DOLPHIN:
        overrides.enableMainlineDolphin = true;
        break;
      case RuntimeFlags.ENABLE_REPLAY_DATABASE:
        overrides.enableReplayDatabase = true;
        break;
      default:
        break;
    }
    i += 1;
  }
  return overrides;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
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
