import React from "react";

import { ReactComponent as DiscordIcon } from "@/styles/images/discord.svg";
import { ReactComponent as PatreonIcon } from "@/styles/images/patreon.svg";

import { RotatingAd } from "./RotatingAd";

export const Advertisements = () => {
  return (
    <RotatingAd
      interval={7000}
      adverts={[
        {
          title: "SUPPORT SLIPPI",
          url: "https://www.patreon.com/fizzi36",
          icon: <PatreonIcon fill="white" height="40" width="40" />,
          subtitle: "Become a Patron",
          backgroundColor: "#F96854",
        },

        {
          title: "NEED HELP?",
          url: "https://discord.gg/pPfEaW5",
          icon: <DiscordIcon fill="white" height="40" width="40" />,
          subtitle: "Join the Discord",
          backgroundColor: "#7289DA",
        },
      ]}
    />
  );
};
