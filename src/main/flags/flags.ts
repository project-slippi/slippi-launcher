export type ConfigFlags = {
  enableMainlineDolphin: boolean;
  enableReplayDatabase: boolean;
};

type ProcessLike = {
  env: Record<string, string | undefined>;
};

const DEVELOPMENT_CONFIG_FLAGS: ConfigFlags = {
  enableMainlineDolphin: true,
  enableReplayDatabase: true,
};

export function getConfigFlags({ env }: ProcessLike = process): ConfigFlags {
  const isDevelopment = env.NODE_ENV === "development" || env.DEBUG_PROD === "true";

  if (isDevelopment) {
    return DEVELOPMENT_CONFIG_FLAGS;
  }

  return {
    enableMainlineDolphin: parseBoolean(env.ENABLE_MAINLINE_DOLPHIN),
    enableReplayDatabase: parseBoolean(env.ENABLE_REPLAY_DATABASE),
  };
}

function parseBoolean(value: string | undefined): boolean {
  if (value === "0" || value === "false" || value === "undefined") {
    return false;
  }
  return Boolean(value);
}
