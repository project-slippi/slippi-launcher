# ![Launcher icon](assets/icons/48x48.png) Slippi Launcher

[![Build Status](https://github.com/project-slippi/slippi-launcher/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/project-slippi/slippi-launcher/actions/workflows/build.yml?query=branch%3Amain)
[![License](https://img.shields.io/badge/license-GPLv3-blue)](https://github.com/project-slippi/slippi-launcher/blob/main/LICENSE)
[![Translations](https://img.shields.io/endpoint?&url=https://jsonhosting.com/api/json/e785d45e/raw)](./CONTRIBUTING.md)

The Slippi Launcher acts as a one stop shop for everything Slippi related. It handles updating Slippi Dolphin, playing Slippi Online, launching and analyzing replays, and more.

This repository is part of the Project Slippi ecosystem. For more information about all of the Project Slippi projects, visit https://github.com/project-slippi/project-slippi.

## Build Instructions

### Prerequisites

These are the applications you will need to install in order to build this project:

- [Git](https://git-scm.com/downloads)
- [Node v20+](https://nodejs.org/en/)

### Build Steps

- Clone the repo via: `git clone https://github.com/project-slippi/slippi-launcher.git`
- Navigate into the directory and run: `npm install` to install all dependencies
- Use `npm run dev` to run the app in develop mode using **mocked services**
- Use `npm run package` to build a release

#### Development Commands

- `npm run dev`: **(Recommended)** Runs the app with mocked services (see `src/renderer/services`). No production keys are required, but not every service feature is supported in this mode. To test logged in features, you can login using the test account using username `test` and password `test`.
- `npm run start`: Runs the app against production services. This may require production API keys, which are provided at discretion for specific feature work. Ask in the `#launcher` Discord channel if you need production API keys.

#### Recommended IDE

For development, we recommend using [VSCode](https://code.visualstudio.com/) with the following plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

These extensions will provide automatic formatting and warnings about code quality issues before you commit/push.

## Project Structure

### The `src` folder is split into the following:

- `common`
  - Code shared between both `main` and `renderer` processes. Code written here should be agnostic to which process it is imported from.
- `main`
  - Code for the main process (e.g. Electron config, menu bars, window management).
- `renderer`
  - Code for the renderer process (the React application).
- `<module>`
  - Main process modules that handle specific tasks (e.g. `broadcast`, `dolphin`, `database`) are kept in their own top-level folders.

### The `renderer` folder is organised as follows:

- `app`
  - Core application logic, setup, and global layout.
- `components`
  - Reusable display components. These should generally not access global state directly.
- `lib`
  - Shared utilities and helper functions.
- `listeners`
  - IPC listeners for handling communication from the main process.
- `pages`
  - The root page components for different views in the app.
- `services`
  - Service layer for handling business logic and API interactions.
- `styles`
  - Global styles and theming configuration.

## Contributing

Contributions are welcome! The [issues section](https://github.com/project-slippi/slippi-launcher/issues) contains some good first ideas. When making a PR, ensure you are not PRing your `main` branch and always describe the feature and what testing you've done so far.

For more information on how to contribute, as well as information on adding app translations see the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## Acknowledgements

This application uses [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) as a base and includes most changes up to commit [10c22e5](https://github.com/electron-react-boilerplate/electron-react-boilerplate/commit/10c22e5).

## License

Slippi Launcher is released as open source software under the [GPL v3](https://opensource.org/licenses/gpl-3.0.html) license. See the [LICENSE](./LICENSE) file in the project root for the full license text.
