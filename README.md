# Slippi Desktop App

This branch is home to the rewrite of the Slippi Desktop App (soon to be renamed, again, to Slippi Launcher). Currently we are working on getting the repo ready for external contributors to start making PRs.

## Motivation

The goal of this rewrite is to make the app more appealing to work on and improve general performance. We will be transitioning to using Typescript and Material UI and will continue using React. Since we are rewriting from scratch we will be implementing features that were previously tough to add. We also plan on making this launcher a one stop shop for Slippi by supporting netplay and playback.

## Project Structure

### The `src` folder is split into the following:

- `common`
  - The code in `common` is for things that are shared between both `main` and `renderer` processes. Thus the code written should be agnostic to which thread its being imported from.
- `main`
  - Code for the main process. e.g. electron config, menubars etc.
- `renderer`
  - Most of your actual app code

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
  - This one is pretty optional so we may kill this folder if it doesn't help much. Basically every container here should represent a single page of the app that can be routed to. It can help give devs a good starting point for understanding a particular component.

## Project Slippi

This repository is part of the Project Slippi ecosystem. For more information about all of the Project Slippi projects, visit https://github.com/project-slippi/project-slippi.

## Intro

This project is home to the desktop app for Project Slippi. The app allows the user to browse and launch replay files. It also has stat analysis tools for replay files.

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
