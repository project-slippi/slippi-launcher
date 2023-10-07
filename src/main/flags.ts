export type ConfigFlags = {
  enableMainlineDolphin: boolean;
  enableReplayDatabase: boolean;
};

const developmentFlags: ConfigFlags = {
  enableMainlineDolphin: true,
  enableReplayDatabase: true,
};

export function getConfigFlags(isDevelopment?: boolean): ConfigFlags {
  if (isDevelopment) {
    return developmentFlags;
  }

  return {
    enableMainlineDolphin: parseBoolean(process.env.ENABLE_MAINLINE_DOLPHIN),
    enableReplayDatabase: parseBoolean(process.env.ENABLE_REPLAY_DATABASE),
  };
}

function parseBoolean(value: string | undefined): boolean {
  if (value === "0") {
    return false;
  }
  return Boolean(value);
}
