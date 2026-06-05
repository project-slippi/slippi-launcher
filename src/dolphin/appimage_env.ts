const appImageEnvVars = [
  "APPDIR",
  "APPIMAGE",
  "ARGV0",
  "LD_LIBRARY_PATH",
  "OWD",
  "QML2_IMPORT_PATH",
  "QT_PLUGIN_PATH",
  "QT_QPA_PLATFORM_PLUGIN_PATH",
];

export function getDolphinProcessEnv(): NodeJS.ProcessEnv {
  if (process.platform !== "linux") {
    return process.env;
  }

  const env = { ...process.env };
  appImageEnvVars.forEach((envVar) => {
    delete env[envVar];
  });

  return env;
}
