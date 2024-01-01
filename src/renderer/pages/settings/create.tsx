import { AdvancedAppSettings } from "./advanced_app_settings/advanced_app_settings";
import { ChatSettings } from "./chat_settings/chat_settings";
import { NetplayDolphinSettings } from "./dolphin_settings/netplay_dolphin_settings";
import { PlaybackDolphinSettings } from "./dolphin_settings/playback_dolphin_settings";
import { GameSettings } from "./game_settings/game_settings";
import { HelpPage } from "./help_page/help_page";
import { ReplaySettings } from "./replay_settings/replay_settings";
import { SettingsPage } from "./settings_page";
import type { SettingSection } from "./types";

export function createSettingsPage(): { Page: React.ComponentType } {
  const settings: SettingSection[] = [
    {
      title: "General Settings",
      items: [
        {
          name: "Game",
          path: "melee-options",
          component: <GameSettings />,
        },
        {
          name: "Replays",
          path: "replay-options",
          component: <ReplaySettings />,
        },
        {
          name: "Chat",
          path: "chat-options",
          component: <ChatSettings />,
        },
      ],
    },
    {
      title: "Dolphin Settings",
      items: [
        {
          name: "Netplay",
          path: "netplay-dolphin-settings",
          component: <NetplayDolphinSettings />,
        },
        {
          name: "Playback",
          path: "playback-dolphin-settings",
          component: <PlaybackDolphinSettings />,
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

  const Page = () => <SettingsPage settings={settings} />;

  return { Page };
}
