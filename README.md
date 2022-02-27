# ![Launcher icon](resources/icons/48x48.png) Slippi Launcher

[![Build Status](https://github.com/project-slippi/slippi-launcher/workflows/build/badge.svg)](https://github.com/project-slippi/slippi-launcher/actions?workflow=build)
[![License](https://img.shields.io/badge/license-GPLv3-blue)](https://github.com/project-slippi/slippi-launcher/blob/master/LICENSE)

The Slippi Launcher acts as a one stop shop for everything Slippi related. It handles updating Slippi Dolphin, playing Slippi Online, launching and analyzing replays, and more.

This repository is part of the Project Slippi ecosystem. For more information about all of the Project Slippi projects, visit https://github.com/project-slippi/project-slippi.

## Build Instructions

### Prerequisites

These are the applications you will need to install in order to build this project:

- [Git](https://git-scm.com/downloads)
- [Node v16+](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/getting-started/install)

### Build Steps

- Clone the repo via: `git clone https://github.com/project-slippi/slippi-launcher.git`
- Navigate into the directory and run: `yarn install` to install all dependencies
- Use `yarn run start` to run the app in develop mode
- Use `yarn run package` to build a release

#### Recommended IDE

For development, we recommend using [VSCode](https://code.visualstudio.com/) with the following plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

These extensions will provide automatic formatting and warnings about code quality issues before you commit/push.

## Project Structure

### The `src` folder is split into the following:

- `common`
  - Code shared between both `main` and `renderer` processes. Thus the code written should be agnostic to which thread its being imported from.
- `main`
  - Code for the main process. e.g. electron config, menubars etc.
- `renderer`
  - Code for the all the visual components
- `<module>`
  - Modules for the main process that handles specfic tasks should be kept in their own folder with a clear name.

### The `renderer` folder is organised as follows:

- `components`
  - "Dumb" components reusable throughout the app. These should not directly access or modify state but should accept handlers and state info via props.
- `containers`
  - Components that piece multiple dumb components together into a single "container". These can modify state and bind logic to the components but make sure most complex logic is in `lib`.
- `lib`
  - Reusable logic goes here to keep the components mainly representative and visual.
- `styles`
  - Code for app styles and theming.
- `views`
  - The root pages of the app. Give a starting point for finding components.

## Contributing

Contributions are welcome! The [issues section](https://github.com/project-slippi/slippi-launcher/issues) contains some good first ideas. When making a PR, ensure you are not PRing your `main` branch and always describe the feature and what testing you've done so far.

## License

Slippi Launcher is released as open source software under the [GPL v3](https://opensource.org/licenses/gpl-3.0.html) license. See the [LICENSE](./LICENSE) file in the project root for the full license text.
