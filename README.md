# ![Launcher icon](resources/icons/48x48.png) Slippi Launcher

The Slippi Launcher acts as a one stop shop for everything Slippi related. It handles updating Slippi Dolphin, playing Slippi Online, launching and analyzing replays, and more.

This repository is part of the Project Slippi ecosystem. For more information about all of the Project Slippi projects, visit https://github.com/project-slippi/project-slippi.

## Build Instructions

### Prerequisites

These are the applications you will need to install in order to build this project:

- [Git](https://git-scm.com/downloads)
- [Node v14+](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/getting-started/install)

### Build Steps

- Clone the repo via: `git clone https://github.com/project-slippi/slippi-launcher.git`
- Navigate into the directory and run: `yarn install` to install all dependencies
- Use `yarn run dev` to develop
- Use `yarn run package` to build a release

#### Recommended IDE

For development, we recommend using [VSCode](https://code.visualstudio.com/) with the following plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

These extensions will provide automatic formatting and warnings about code quality issues before you commit/push.

## Project Structure

### The `src` folder is split into the following:

- `common`
  - The code in `common` is for things that are shared between both `main` and `renderer` processes. Thus the code written should be agnostic to which thread its being imported from.
- `main`
  - Code for the main process. e.g. electron config, menubars etc.
- `renderer`
  - Most of your actual app code
- `<module>`
  - Modules for the main process that handles specfic tasks should be kept in their own folder with a clear name.

### The `renderer` folder is organised as follows:

- `components`
  - Dumb components which are reusable throughout the app. These should not directly access or modify state but should accept handlers and state info via props.
- `containers`
  - These components piece multiple dumb components together into a single "container". These can modify state and bind logic to the components but make sure most complex logic is in `lib`.
- `lib`
  - Put reusable logic here so you can keep the components mainly representative and visual.
- `styles`
  - App styles and theming.
- `views`
  - The main pages of the app that can be routed to. Can give a starting point for finding components.

## Contributing

Contributions are welcome! The [issues section](https://github.com/project-slippi/slippi-launcher/issues) contains some good first ideas. When making a PR, ensure you are not PRing your `main` branch and always describe the feature and what testing you've done so far.
