# Slippi Desktop App
## Project Slippi
This repository is part of the Project Slippi ecosystem. For more information about all of the Project Slippi projects, visit https://github.com/project-slippi/project-slippi.

## Intro
This project is home to the desktop app for Project Slippi. The app allows the user to browse and launch replay files. It also has stat analysis tools for replay files.

## Build Instructions
### Prerequisites
These are the applications you will need to install in order to build this project:
- Git: https://git-scm.com/downloads
- Node v10.X: https://nodejs.org/en/
- yarn: https://yarnpkg.com/en/docs/install

### Build Steps
- Clone the repo via: `git clone git@github.com:project-slippi/slippi-desktop-app.git`
- Navigate into the directory and run: `yarn` to install all dependencies
- Use `yarn dev` to develop
- Use `yarn package` to build a release

If you have some weird errors when starting `yarn dev` but think everything else went okay, you can try the following:
```
$ UPGRADE_EXTENSIONS=1 yarn dev

# For Windows
$ set UPGRADE_EXTENSIONS=1 && yarn dev
```
