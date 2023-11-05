import { FlagBuilder } from "./flag_builder";

export type ConfigFlags = {
  enableReplayDatabase: boolean;
};

enum RuntimeFlags {
  ENABLE_REPLAY_DATABASE = "--enable-replay-database",
}

const DEVELOPMENT_CONFIG_FLAGS: ConfigFlags = {
  enableReplayDatabase: true,
};

export function getConfigFlags(): ConfigFlags {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment) {
    return DEVELOPMENT_CONFIG_FLAGS;
  }

  const flags = new FlagBuilder()
    .addBooleanFlag("enableReplayDatabase", process.env.ENABLE_REPLAY_DATABASE, false)
    .withOverride("enableReplayDatabase", RuntimeFlags.ENABLE_REPLAY_DATABASE)
    .build();
  return flags;
}
