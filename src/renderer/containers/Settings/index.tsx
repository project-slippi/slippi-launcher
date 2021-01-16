import Typography from "@material-ui/core/Typography";
import React from "react";

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
        name: "Settings Page 2",
        path: "page-2",
        component: (
          <div>
            <Typography variant="h5">Settings Page 2</Typography>
          </div>
        ),
      },
      {
        name: "Settings Page 3",
        path: "page-3",
        component: (
          <div>
            <Typography variant="h5">Settings Page 3</Typography>
          </div>
        ),
      },
    ],
  },
];
