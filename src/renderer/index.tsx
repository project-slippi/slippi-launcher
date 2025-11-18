import log from "electron-log";
import React, { Suspense } from "react";
import { render } from "react-dom";

import { createApp } from "./app/create";
import { LoadingScreen } from "./components/loading_screen";
import { initializeApp } from "./initialize_app";
import { installAppListeners } from "./install_app_listeners";
import { installServices } from "./services/install";

// Create a lazy-loaded component that waits for async initialization
const LazyApp = React.lazy(async () => {
  try {
    // Install services and wait for initialization
    const services = await installServices();
    // Install app listeners after services are ready
    installAppListeners(services);

    await initializeApp(services);

    // Create and return the app component
    const { App } = createApp({ services });
    return { default: App };
  } catch (error) {
    log.error(error);
    throw error;
  }
});

render(
  <React.StrictMode>
    <Suspense fallback={<LoadingScreen />}>
      <LazyApp />
    </Suspense>
  </React.StrictMode>,
  document.getElementById("app"),
);
