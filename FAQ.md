## What is Rollback?

Rollback is a superior netcode implementation to the delay based netcode that everyone is used to. It provides smooth gameplay for a larger variety of situations. It also allows for playing with people much further away.

## How do I get started?

Head on over to <https://slippi.gg/downloads> and download the Slippi Launcher. Walk through its setup and you should be good to go.

## What versions of Melee does Slippi support

We only support NTSC-U/J 1.02

## How do I setup my GameCube Controller Adapter?

Set your adapter to Wii U/Switch mode and then follow the section for your OS.

### Windows

1. Close Dolphin.
2. Download [slippi-zadig](https://github.com/project-slippi/libwdi/releases/download/slippi-v1/slippi-zadig.exe) and run it.
3. If any device shows up, hit Install Driver.
4. Accept modifying System Drivers if a prompt shows up.
5. Start Dolphin and go to the Controllers -> Configure and make sure your poll rate is around 125hz.
6. (Optional) Install [drivers](https://docs.google.com/document/d/1cQ3pbKZm_yUtcLK9ZIXyPzVbTJkvnfxKIyvuFMwzWe0/edit?usp=sharing) to overclock the poll rate to up to 1000hz.

### macOS

#### High Sierra to Mojave (10.13 - 10.15)

Download and install [GCAdapterDriver](https://github.com/secretkeysio/GCAdapterDriver/releases/download/1.0/GCAdapterDriverInstaller.pkg).

#### Big Sur

Read the installation instructions for [GCAdapterDriver](https://github.com/secretkeysio/GCAdapterDriver/releases#:~:text=with%20existing%20installations.-,Installation,-macOS%2010.13-10.15). Ask in our Discord's #mac-support channel for further help.

### Linux

Run the following command block

> sudo rm -f /etc/udev/rules.d/51-gcadapter.rules && sudo touch /etc/udev/rules.d/51-gcadapter.rules && echo 'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTRS{idVendor}=="057e", ATTRS{idProduct}=="0337", MODE="0666"' | sudo tee /etc/udev/rules.d/51-gcadapter.rules > /dev/null && sudo udevadm control --reload-rules

There is no output, so once it is finished restart Dolphin and test your adapter.

If your adapter still doesn't work then try running the command below if you use systemd or restarting your computer.

`sudo systemctl restart udev.service`

## What are delay frames and how do I change them?

A single delay frame is equal to 4 buffer in traditional Dolphin netplay. Our recommended default is 2 frame delay (8 buffer). We suggest using 2 frame delay for connections up to 130ms ping. Mixed buffers are allowed to play each other.

If you want to change this value, first open Dolphin (if using the Launcher go to `Settings` -> `Netplay` -> `Configure Dolphin`) and go to `Config->GameCube`. At the bottom you will see the option to update the Delay Frames. You can update this value at any time but it will only update for the next game you play (e.g if you are in a game it won't take effect until the next game).

## Why is there no music?

Music currently breaks during rollback so music is disabled completely in the current build, this may be fixed in the future.
‎‎‏‏‎ ‎‏‏‎ ‎‏‏‎ ‎

## Can I use Widescreen when playing Slippi Online?

Yes. To enable Widescreen for Slippi Online follow these steps. Open Dolphin, right click on your Melee ISO, go to `Properties->Gecko Codes`. Then enable the Widescreen gecko code and set the Dolphin aspect ratio to 16:9 under the Graphics settings. Do not use the dolphin widescreen hack, it does not have the same effect as the gecko code.

## Is UCF included in Slippi Online?

Yes, we currently ship with UCF 0.8 and it is applied everywhere by default.

## Where can I find a Melee ISO

We cannot help you find an ISO, you will need to acquire one yourself. This website may be a starting point: <https://wiki.dolphin-emu.org/index.php?title=Ripping_Games>.

## Can I play Free For All with Slippi Online?

No, only singles (1v1) and teams (2v2, 3v1, 2v1v1) is supported at this time. Free For All won't be added in the near future, but is not off the table entirely.

## I get a VCRUNTIME error whenever I launch Dolphin

Install this: <https://aka.ms/vs/16/release/vc_redist.x64.exe>

## Some of my inputs aren't going through correctly

If you have Mayflash or official Wii U adapter then we suggest trying ALL USB ports on your computer. If you have a Ryzen CPU we also suggest reading this reddit thread

<https://www.reddit.com/r/SSBM/comments/hf41fw/solving_dropped_inputschoppy_movement_on_amd/>

If changing ports doesn't work then try the following:

<https://www.reddit.com/r/fastermelee/comments/d6o332/controller_issueneutralize_inputs_on_ryzen_fix/>

## Where did my replays go?

Replays have moved to `Documents/Slippi` on Windows and `~/Slippi` on macOS and Linux. The replay directory is configurable in `Config->Slippi` of the netplay Dolphin.
