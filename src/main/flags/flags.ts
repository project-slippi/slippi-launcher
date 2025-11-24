import { FlagBuilder } from "./flag_builder";

export type ConfigFlags = {
  enableReplayDatabase: boolean;
  enableI18n: boolean;
};

enum RuntimeFlags {
  ENABLE_REPLAY_DATABASE = "--enable-replay-database",
  ENABLE_I18N = "--enable-i18n",
}

const DEVELOPMENT_CONFIG_FLAGS: ConfigFlags = {
  enableReplayDatabase: true,
  enableI18n: true,
};

export function getConfigFlags(): ConfigFlags {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment) {
    return DEVELOPMENT_CONFIG_FLAGS;
  }

  const flags = new FlagBuilder()
    .addBooleanFlag("enableReplayDatabase", process.env.ENABLE_REPLAY_DATABASE, false)
    .withOverride("enableReplayDatabase", RuntimeFlags.ENABLE_REPLAY_DATABASE)
    .addBooleanFlag("enableI18n", process.env.ENABLE_I18N, true)
    .withOverride("enableI18n", RuntimeFlags.ENABLE_I18N)
    .build();
  return flags;
}
