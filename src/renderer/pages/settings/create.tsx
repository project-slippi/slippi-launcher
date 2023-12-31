import { DolphinLaunchType } from "@dolphin/types";

import { AdvancedAppSettings } from "@/containers/Settings/AdvancedAppSettings";
import { ChatOptions } from "@/containers/Settings/ChatOptions";
import { DolphinSettings } from "@/containers/Settings/DolphinSettings";
import { HelpPage } from "@/containers/Settings/HelpPage";
import { MeleeOptions } from "@/containers/Settings/MeleeOptions";
import { ReplayOptions } from "@/containers/Settings/ReplayOptions";
import type { SettingSection } from "@/containers/Settings/types";

import { SettingsPage } from "./settings_page";

export function createSettingsPage(): { Page: React.ComponentType } {
  const settings: SettingSection[] = [
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
        {
          name: "Chat",
          path: "chat-options",
          component: <ChatOptions />,
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
          component: <AdvancedAppSettings />,
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

  return { Page: () => <SettingsPage settings={settings} /> };
}
