const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Check if the renderer and main bundles are built
function CopyDolphin() {
  const platform = process.platform;

  const targetFolder = './app/dolphin';

  switch (platform) {
  case 'darwin':
    console.log('Copying the mac build of dolphin to package');
    copyForMac(targetFolder);
    break;
  case 'win32':
    console.log('Copying the windows build of dolphin to package');
    copyForWindows(targetFolder);
    break;
  case 'linux':
    copyForLinux(targetFolder);
    break;
  default:
    throw new Error('Platform not yet supported.');
  }

  console.log('Finished copying dolphin build!');
}

function copyForMac(targetFolder) {
  const dolphinSource = './app/dolphin-dev/osx/Slippi Dolphin.app';
  if (!fs.existsSync(dolphinSource)) {
    throw new Error(
      'Must have a Slippi Dolphin.app application in dolphin-dev/osx folder.'
    );
  }

  const dolphinDest = path.join(targetFolder, 'Slippi Dolphin.app');
  const dolphinDestSysFolder = path.join(dolphinDest, 'Contents/Resources/Sys');
  const dolphinDestSlippiFolder = path.join(targetFolder, 'Slippi');
  const gitIgnoreDest = path.join(targetFolder, '.gitignore');

  const overwriteSysFolder = './app/dolphin-dev/overwrite/Sys';

  const commands = [
    `rm -rf "${targetFolder}"`,
    `mkdir "${targetFolder}"`,
    `ditto "${dolphinSource}" "${dolphinDest}"`,
    `ditto "${overwriteSysFolder}" "${dolphinDestSysFolder}"`,
    `rm -rf "${gitIgnoreDest}"`,
    `mkdir "${dolphinDestSlippiFolder}"`,
  ];

  const command = commands.join(' && ');
  execSync(command);
}

function copyForWindows(targetFolder) {
  const sourceFolder = './app/dolphin-dev/windows';
  const dolphinSource = './app/dolphin-dev/windows/Slippi Dolphin.exe';
  if (!fs.existsSync(dolphinSource)) {
    throw new Error(
      'Must have a Slippi Dolphin.exe file in dolphin-dev/windows folder.'
    );
  }

  const dolphinDestSysFolder = path.join(targetFolder, 'Sys');
  const dolphinDestSlippiFolder = path.join(targetFolder, 'Slippi');
  const gitIgnoreDest = path.join(targetFolder, '.gitignore');

  const overwriteSysFolder = './app/dolphin-dev/overwrite/Sys';

  fs.emptyDirSync(targetFolder);
  fs.copySync(sourceFolder, targetFolder);
  fs.copySync(overwriteSysFolder, dolphinDestSysFolder);
  fs.removeSync(gitIgnoreDest);
  fs.emptyDirSync(dolphinDestSlippiFolder);
}

// We only want to package AppImages in the Linux builds
function copyForLinux(targetFolder) {
  const dolphinSource = "./app/dolphin-dev/linux/Slippi_Playback-x86_64.AppImage";
  const dolphinDest = path.join(targetFolder, "Slippi_Playback-x86_64.AppImage");
  if (!fs.existsSync(dolphinSource)) {
    console.log("Must have a Slippi_Playback-x86_64.AppImage file in dolphin-dev/linux folder if you would like to package a Dolphin build.");
    return
  }

  fs.emptyDirSync(targetFolder);
  fs.copyFileSync(dolphinSource, dolphinDest);
}

CopyDolphin();
