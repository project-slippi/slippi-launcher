## What is Rollback?

Rollback is a superior netcode implementation to the delay based netcode that everyone is used to. It provides smooth gameplay for a larger variety of situations. It also allows for playing with people much further away.

## What versions of Melee does Slippi support?

We only support NTSC-U/J 1.02.

## It says "Required DLLs/libraries are missing" when I hit Play!

### Windows

Download and install the file at the link: <https://aka.ms/vs/17/release/vc_redist.x64.exe>

### Linux

If you are on Ubuntu, PopOS, or similar, open a terminal and run

> sudo apt install libopengl0

## How do I setup my GameCube Controller Adapter?

Set your adapter to Wii U/Switch mode and then follow the section for your OS.

### Windows

When installing Slippi Launcher you would have seen an option to also "install Gamecube adapter drivers". If you selected this, your adapter should already work once plugged into your computer. If you didn't select this option, you can just reinstall the latest version of the Slippi Launcher by downloading the installer from the [official Slippi website](https://slippi.gg). Make sure to select the "install Gamecube adapter drivers" option once the installer is run.

You can confirm your controller adapters work by doing the following:

1. Start Dolphin (Settings -> Netplay -> Configure Dolphin)
2. Go to the Controllers -> Configure and make sure your poll rate is around 125hz.

You can also optionally [overclock](https://docs.google.com/document/d/1cQ3pbKZm_yUtcLK9ZIXyPzVbTJkvnfxKIyvuFMwzWe0/edit?usp=sharing) your adapter drivers to increase the poll rate to up to 1000hz.

### macOS

Download and install [GCAdapterDriver](https://secretkeys.io/gcadapterdriver/). Ask in the Slippi Discord's #mac-support channel for further help.

#### High Sierra to Mojave (10.13 - 10.15)

Make sure to check the "overclock" option when installing your driver. This will bump your controller poll rate up to 1000hz.

### Linux

Run the following command block

> sudo rm -f /etc/udev/rules.d/51-gcadapter.rules && sudo touch /etc/udev/rules.d/51-gcadapter.rules && echo 'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTRS{idVendor}=="057e", ATTRS{idProduct}=="0337", MODE="0666"' | sudo tee /etc/udev/rules.d/51-gcadapter.rules > /dev/null && sudo udevadm control --reload-rules

There is no output, so once it is finished restart Dolphin and test your adapter.

If your adapter still doesn't work then try running the command below if you use systemd or restarting your computer.

> sudo systemctl restart udev.service

On some distributions you need to run this command instead to restart the service:

> sudo systemctl restart systemd-udevd.service

## What are delay frames and how do I change them?

Delay frames are how we account for the time it takes to send an opponent your input. Since we have removed about 1.5 frames of visual delay from Melee, adding 2 frames brings us very close to a CRT experience. Using a 120hz+ monitor removes an additional half frame giving to bring us in line with CRT.

A single delay frame is equal to 4 buffer in traditional Dolphin netplay. Our recommended default is 2 frame delay (8 buffer). We suggest using 2 frame delay for connections up to 130ms ping. Mixed buffers are allowed to play each other.

If you want to change this value, first open Dolphin (if using the Launcher go to Settings -> Netplay -> Configure Dolphin) and go to `Config` -> `GameCube`. At the bottom you will see the option to update the Delay Frames. You can update this value at any time but it will only update for the next game you play.

## Why is there no music?

Game music breaks because of the changes required to support rollback so it isn't enabled in the current build at all. Replays will still have music when watching rollback replays.

You can however play your own music for netplay with m'overlay which supports playing music based on the game state (like if you are on a specific stage or on the menus).
Instructions can be found [here](https://github.com/bkacjios/m-overlay/wiki/Stage-music-for-Project-Slippi).

Game music can be removed from replays by opening Dolphin (if using the Launcher go to Settings -> Netplay -> Configure Dolphin), right clicking Melee -> Properties -> Gecko Codes, and enabling the "Game Music OFF" gecko code.

## Can I use Widescreen when playing Slippi Online?

Yes. To enable Widescreen for Slippi Online follow these steps. Open Dolphin (if using the Launcher go to Settings -> Netplay -> Configure Dolphin), right click on your Melee in the games list, go to Properties -> Gecko Codes. Then enable the Widescreen gecko code and set the Dolphin aspect ratio to 16:9 under the Graphics settings. Do not use the dolphin widescreen hack, it does not have the same effect as the gecko code.

## Is UCF included in Slippi Online?

Yes, we currently ship with UCF 0.8 and it is applied everywhere by default.

## Where can I find a Melee ISO?

We do not provide a Melee NTSC 1.02 ISO and we cannot help you find one, you will need to acquire one yourself. You can look into this: (https://wiki.dolphin-emu.org/index.php?title=Ripping_Games).

## Can I play Free For All with Slippi Online?

No, only singles (1v1) and teams (2v2, 3v1, 2v1v1) are supported at this time. Free For All is not currently on our roadmap, but is not off the table entirely.

## Some of my inputs aren't going through correctly

Some computers will have issues polling the adapter at the correct rate on some USB ports, we suggest trying ALL USB ports on your computer to see if any of them poll the adapter at 125hz. You can check the poll rate by opening Dolphin (if using the Launcher go to Settings -> Netplay -> Configure Dolphin), clicking Controllers, and then configure on any of the ports that are set to GameCube Adapter for Wii U.

## Where are my replays?

Replays are stored by default in `Documents/Slippi` on Windows and `~/Slippi` on macOS and Linux. The replay directory is configurable in the Replays settings of the Launcher.
