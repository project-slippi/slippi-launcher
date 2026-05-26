import { FlagBuilder } from "./flag_builder";

export type ConfigFlags = {
  enableI18n: boolean;
};

enum RuntimeFlags {
  ENABLE_I18N = "--enable-i18n",
}

const isDevelopment = process.env.NODE_ENV === "development";

const DEVELOPMENT_CONFIG_FLAG_OVERRIDES: Partial<ConfigFlags> = {
  enableI18n: true,
};

export function getConfigFlags(): ConfigFlags {
  const flags = new FlagBuilder()
    .addBooleanFlag("enableI18n", process.env.ENABLE_I18N, true)
    .withOverride("enableI18n", RuntimeFlags.ENABLE_I18N)
    .build();

  if (isDevelopment) {
    return {
      ...flags,
      ...DEVELOPMENT_CONFIG_FLAG_OVERRIDES,
    };
  }

  return flags;
}
