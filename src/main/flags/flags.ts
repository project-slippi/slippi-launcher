export type ConfigFlags = {
  enableMainlineDolphin: boolean;
  enableReplayDatabase: boolean;
};

export enum RuntimeFlags {
  ENABLE_MAINLINE_DOLPHIN = "--enable-mainline-dolphin",
  ENABLE_REPLAY_DATABASE = "--enable-replay-database",
}

type ProcessLike = {
  env: Record<string, string | undefined>;
  argv: string[];
};

const DEVELOPMENT_CONFIG_FLAGS: ConfigFlags = {
  enableMainlineDolphin: true,
  enableReplayDatabase: true,
};

export function getConfigFlags(proc: ProcessLike = process): ConfigFlags {
  const isDevelopment = proc.env.NODE_ENV === "development" || proc.env.DEBUG_PROD === "true";
  if (isDevelopment) {
    return DEVELOPMENT_CONFIG_FLAGS;
  }

  const buildFlags = getBuildFlags(proc);
  const runtimeFlags = getRuntimeFlags(proc);

  return {
    ...buildFlags,
    ...runtimeFlags,
  };
}

export function getBuildFlags({ env }: Pick<ProcessLike, "env"> = process): ConfigFlags {
  return {
    enableMainlineDolphin: parseBoolean(env.ENABLE_MAINLINE_DOLPHIN, false),
    enableReplayDatabase: parseBoolean(env.ENABLE_REPLAY_DATABASE, false),
  };
}

export function getRuntimeFlags({ argv }: Pick<ProcessLike, "argv"> = process): Partial<ConfigFlags> {
  const overrides: Partial<ConfigFlags> = {};
  const args = argv.slice(1);

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

  if (value === "0" || value.toLowerCase() === "false" || value.toLowerCase() === "undefined") {
    return false;
  }
  return true;
}
