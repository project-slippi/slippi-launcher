# Slippi Launcher

## Project Slippi

This repository is part of the Project Slippi ecosystem. For more information about all of the Project Slippi projects, visit https://github.com/project-slippi/project-slippi.

## Intro

This project is home to the launcher for Slippi. The launcher acts as a one stop shop for everything Slippi related. It handles updating Slippi Dolphin, playing Slippi Online, launching and analyzing replays, and more.

## Contributing

Contributions are definitely welcome, the issues section contains some good first ideas. When making a PR, ensure you are not PRing your `main` branch and always describe the feature and what testing you've done so far.

## Build Instructions

### Prerequisites

These are the applications you will need to install in order to build this project:

- [Git](https://git-scm.com/downloads)
- [Node v14+](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/getting-started/install)

#### Recommended IDE + Extensions

For development, we recommend using [VSCode](https://code.visualstudio.com/) with the following plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

These extensions will provide automatic formatting and warnings about code quality issues before you commit/push.

### Build Steps

- Clone the repo via: `git clone https://github.com/project-slippi/slippi-launcher.git`
- Navigate into the directory and run: `yarn` to install all dependencies
- Use `yarn dev` to develop
- Use `yarn package` to build a release

If you have some weird errors when starting `yarn dev` but think everything else went okay, you can try the following:

```
$ UPGRADE_EXTENSIONS=1 yarn dev

# For Windows
$ set UPGRADE_EXTENSIONS=1 && yarn dev
```

## Project Structure

### The `src` folder is split into the following:

- `common`
  - The code in `common` is for things that are shared between both `main` and `renderer` processes. Thus the code written should be agnostic to which thread its being imported from.
- `main`
  - Code for the main process. e.g. electron config, menubars etc.
- `renderer`
  - Most of your actual app code
- `*`
  - Code for the main process that handles specfic tasks as described by the folder names.

### The `renderer` folder is organised as follows:

- `components`
  - Dumb components which are reusable throughout the app. These should not directly access or modify state but should accept handlers and state info via props.
- `containers`
  - These components piece multiple dumb components together into a single "container". These can modify state and bind logic to the components but make sure most complex logic is in `lib`.
- `lib`
  - This is basically your `domain` folder in the previous desktop app. Put all your reusable logic here so you can keep the components mainly representative and visual.
- `store`
  - Your shared global app state.
- `styles`
  - App styles and theming stuff
- `views`
  - Every container here should represent a single page of the app that can be routed to. It can help give devs a good starting point for understanding a particular component.
