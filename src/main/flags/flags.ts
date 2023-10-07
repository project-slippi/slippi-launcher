export type ConfigFlags = {
  enableMainlineDolphin: boolean;
  enableReplayDatabase: boolean;
};

type ProcessLike = {
  env: Record<string, string | undefined>;
};

// Exported for testing
export const DEVELOPMENT_CONFIG_FLAGS: ConfigFlags = {
  enableMainlineDolphin: true,
  enableReplayDatabase: true,
};

export function getConfigFlags({ env }: ProcessLike = process): ConfigFlags {
  const isDevelopment = env.NODE_ENV === "development" || env.DEBUG_PROD === "true";

  if (isDevelopment) {
    return DEVELOPMENT_CONFIG_FLAGS;
  }

  return {
    enableMainlineDolphin: parseBoolean(env.ENABLE_MAINLINE_DOLPHIN, false),
    enableReplayDatabase: parseBoolean(env.ENABLE_REPLAY_DATABASE, false),
  };
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) {
    return defaultValue;
  }

  if (value === "0" || value === "false" || value === "undefined") {
    return false;
  }
  return Boolean(value);
}
