import React from "react";
import { SettingSection } from "./types";

export const settings: SettingSection[] = [
  {
    title: "General Settings",
    items: [
      {
        name: "Melee",
        path: "melee",
        component: <div>Melee Options</div>,
      },
      {
        name: "Dolphin",
        path: "dolphin",
        component: <div>Dolphin Options</div>,
      },
    ],
  },
];
