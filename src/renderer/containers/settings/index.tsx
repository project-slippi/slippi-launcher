import React from "react";
import { MeleeOptions } from "./MeleeOptions";
import { SettingSection } from "./types";

export const settings: SettingSection[] = [
  {
    title: "General Settings",
    items: [
      {
        name: "Melee",
        path: "melee-options",
        component: <MeleeOptions />,
      },
      {
        name: "Advanced Melee",
        path: "advanced-melee-options",
        component: <div>Advanced Melee Options</div>,
      },
      {
        name: "Dolphin",
        path: "melee-options-2",
        component: <div>Dolphin Options</div>,
      },
    ],
  },
];
