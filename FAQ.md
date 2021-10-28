## What is Rollback?

Rollback is a superior netcode implementation to the delay based netcode that everyone is used to. It provides smooth gameplay for a larger variety of situations. It also allows for playing with people much further away.

## What versions of Melee does Slippi support?

We only support NTSC-U/J 1.02.

## How do I setup my GameCube Controller Adapter?

Set your adapter to Wii U/Switch mode and then follow the section for your OS.

### Windows

When installing Slippi Launcher you would have seen an option to also `install Gamecube adapter drivers`. If you selected this, your adapter should already work once plugged into your computer. If you didn't select this option, you can just reinstall the latest version of the Slippi Launcher by downloading the installer from the [official Slippi website](https://slippi.gg). Make sure to select the `install Gamecube adapter drivers` option once the installer is run.

You can confirm your controller adapters work by doing the following:

1. Start Dolphin (Settings -> Netplay -> Configure Dolphin)
2. Go to the Controllers -> Configure and make sure your poll rate is around 125hz.

You can also optionally [overclock](https://docs.google.com/document/d/1cQ3pbKZm_yUtcLK9ZIXyPzVbTJkvnfxKIyvuFMwzWe0/edit?usp=sharing) your adapter drivers to increase the poll rate to up to 1000hz.

### macOS

Download and install [GCAdapterDriver](https://secretkeys.io/gcadapterdriver/). Ask in our Discord's #mac-support channel for further help.

#### High Sierra to Mojave (10.13 - 10.15)

Make sure to check the "overclock" option when installing your driver. This will bump your controller poll rate up to 1000hz.

### Linux

Run the following command block

> sudo rm -f /etc/udev/rules.d/51-gcadapter.rules && sudo touch /etc/udev/rules.d/51-gcadapter.rules && echo 'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", ATTRS{idVendor}=="057e", ATTRS{idProduct}=="0337", MODE="0666"' | sudo tee /etc/udev/rules.d/51-gcadapter.rules > /dev/null && sudo udevadm control --reload-rules

There is no output, so once it is finished restart Dolphin and test your adapter.

If your adapter still doesn't work then try running the command below if you use systemd or restarting your computer.

`sudo systemctl restart udev.service`

## What are delay frames and how do I change them?

Delay frames are how we account for the time it takes to send an opponent your input. Since we have removed about 1.5 frames of visual delay from Melee, adding 2 frames brings us very close to a CRT experience. Using a 120hz+ monitor removes an additional half frame giving to bring us in line with CRT.

A single delay frame is equal to 4 buffer in traditional Dolphin netplay. Our recommended default is 2 frame delay (8 buffer). We suggest using 2 frame delay for connections up to 130ms ping. Mixed buffers are allowed to play each other.

If you want to change this value, first open Dolphin (if using the Launcher go to `Settings` -> `Netplay` -> `Configure Dolphin`) and go to `Config` -> `GameCube`. At the bottom you will see the option to update the Delay Frames. You can update this value at any time but it will only update for the next game you play.

## Why is there no music?

Game music breaks with rollback so it isn't enabled in the current build at all. Replays will still have music when watching rollback replays.

You can however play your own music for netplay with m'overlay which supports playing music based on the game state (like if you are on a specific stage or on the menus).
Instructions can be found [here](https://github.com/bkacjios/m-overlay/wiki/Stage-music-for-Project-Slippi).

Game music can be removed from replays by going to the settings page of the Slippi Launcher, `Playback` -> `Configure Dolphin`, right clicking Melee -> `Properties` -> `Gecko Codes`, and enabling the `Game Music OFF` gecko code.
‎‎‏‏‎ ‎‏‏‎ ‎‏‏‎ ‎

## Can I use Widescreen when playing Slippi Online?

Yes. To enable Widescreen for Slippi Online follow these steps. Open Dolphin, right click on your Melee ISO, go to `Properties` -> `Gecko Codes`. Then enable the Widescreen gecko code and set the Dolphin aspect ratio to 16:9 under the Graphics settings. Do not use the dolphin widescreen hack, it does not have the same effect as the gecko code.

## Is UCF included in Slippi Online?

Yes, we currently ship with UCF 0.8 and it is applied everywhere by default.

## Where can I find a Melee ISO?

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

## Where are my replays?

Replays are stored by default in `Documents/Slippi` on Windows and `~/Slippi` on macOS and Linux. The replay directory is configurable in `Config->Slippi` of the netplay Dolphin.
