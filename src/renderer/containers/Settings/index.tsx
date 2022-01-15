import { DolphinLaunchType } from "@dolphin/types";
import React from "react";

import { DolphinSettings } from "./DolphinSettings";
import { HelpPage } from "./HelpPage";
import { LauncherOptions } from "./LauncherOptions";
import { MeleeOptions } from "./MeleeOptions";
import { ReplayOptions } from "./ReplayOptions";
import { SettingSection } from "./types";

export const settings: SettingSection[] = [
  {
    title: "General Settings",
    items: [
      {
        name: "Game",
        path: "melee-options",
        component: <MeleeOptions />,
      },
      {
        name: "Replays",
        path: "replay-options",
        component: <ReplayOptions />,
      },
    ],
  },
  {
    title: "Dolphin Settings",
    items: [
      {
        name: "Netplay",
        path: "netplay-dolphin-settings",
        component: <DolphinSettings dolphinType={DolphinLaunchType.NETPLAY} />,
      },
      {
        name: "Playback",
        path: "playback-dolphin-settings",
        component: <DolphinSettings dolphinType={DolphinLaunchType.PLAYBACK} />,
      },
    ],
  },
  {
    title: "App Settings",
    items: [
      {
        name: "Advanced",
        path: "advanced-settings",
        component: <LauncherOptions />,
      },
    ],
  },
  {
    items: [
      {
        name: "Help",
        path: "help",
        component: <HelpPage />,
      },
    ],
  },
];
