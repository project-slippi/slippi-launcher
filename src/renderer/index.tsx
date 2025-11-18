import log from "electron-log";
import React from "react";
import { render } from "react-dom";

import { createApp } from "./app/create";
import { installAppListeners } from "./install_app_listeners";
import { installServices } from "./services/install";

async function main() {
  const services = await installServices();
  installAppListeners();
  const { App } = createApp({ services });
  render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("app"),
  );
}

void main().catch(log.error);
