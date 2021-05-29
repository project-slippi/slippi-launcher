import { DolphinLaunchType } from "@dolphin/types";
import React from "react";

import { DolphinSettings } from "./DolphinSettings";
import { MeleeOptions } from "./MeleeOptions";
import { SettingSection } from "./types";

export const settings: SettingSection[] = [
  {
    title: "General Settings",
    items: [
      {
        name: "Melee Options",
        path: "melee-options",
        component: <MeleeOptions />,
      },
      {
        name: "Netplay Dolphin Settings",
        path: "netplay-dolphin-settings",
        component: <DolphinSettings dolphinType={DolphinLaunchType.NETPLAY} />,
      },
      {
        name: "Playback Dolphin Settings",
        path: "playback-dolphin-settings",
        component: <DolphinSettings dolphinType={DolphinLaunchType.PLAYBACK} />,
      },
    ],
  },
];
