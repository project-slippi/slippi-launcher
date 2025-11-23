import "@/styles/styles.scss";

import { ThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import log from "electron-log";
import React, { Suspense } from "react";
import { render } from "react-dom";

import { ToastProvider } from "@/components/toast_provider";
import { slippiTheme } from "@/styles/theme";

import { createApp } from "./app/create";
import { LoadingScreen } from "./components/loading_screen/loading_screen";
import { initializeApp } from "./initialize_app";
import { installAppListeners } from "./listeners/install_app_listeners";
import { installServices } from "./services/install";

// Create a lazy-loaded component that waits for async initialization
const LazyApp = React.lazy(async () => {
  try {
    // Install services and wait for initialization
    const services = await installServices();

    // Install app listeners first
    installAppListeners(services);

    // Then do things that might require us having been listening to changes
    await initializeApp(services);

    // Create and return the app component
    const { App } = createApp({ services });
    return { default: App };
  } catch (error) {
    log.error(error);
    throw error;
  }
});

// We only initialize theme providers and toast providers here, before the rest of the
// the app. We need the toast provider so we can show errors and notify during suspense,
// and we need the theme providers so the notifications are styled correctly.
render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst={true}>
      <MuiThemeProvider theme={slippiTheme}>
        <ThemeProvider theme={slippiTheme as any}>
          <ToastProvider>
            <Suspense fallback={<LoadingScreen />}>
              <LazyApp />
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
  document.getElementById("app"),
);
