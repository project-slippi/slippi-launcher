import { AdvancedAppSettings } from "./advanced_app_settings/advanced_app_settings";
import { AppearanceSettings } from "./appearance_settings/appearance_settings";
import { ChatSettings } from "./chat_settings/chat_settings";
import { SettingsCreateMessages as Messages } from "./create.messages";
import { NetplayDolphinSettings } from "./dolphin_settings/netplay_dolphin_settings";
import { PlaybackDolphinSettings } from "./dolphin_settings/playback_dolphin_settings";
import { GameSettings } from "./game_settings/game_settings";
import { HelpPage } from "./help_page/help_page";
import { ReplaySettings } from "./replay_settings/replay_settings";
import { SettingsPage } from "./settings_page";
import { SpectateSettings } from "./spectate_settings/spectate_settings";
import type { SettingSection } from "./types";

const configFlags = window.electron.bootstrap.flags;

export function createSettingsPage(): { Page: React.ComponentType } {
  const settings: SettingSection[] = [
    {
      title: () => Messages.generalSettings(),
      items: [
        {
          name: () => Messages.game(),
          path: "melee-options",
          component: <GameSettings />,
        },
        {
          name: () => Messages.replays(),
          path: "replay-options",
          component: <ReplaySettings />,
        },
        {
          name: () => Messages.chat(),
          path: "chat-options",
          component: <ChatSettings />,
        },
        {
          name: () => Messages.spectate(),
          path: "spectate-options",
          component: <SpectateSettings />,
        },
      ],
    },
    {
      title: () => Messages.dolphinSettings(),
      items: [
        {
          name: () => Messages.netplay(),
          path: "netplay-dolphin-settings",
          component: <NetplayDolphinSettings />,
        },
        {
          name: () => Messages.playback(),
          path: "playback-dolphin-settings",
          component: <PlaybackDolphinSettings />,
        },
      ],
    },
    {
      title: () => Messages.appSettings(),
      items: [
        {
          name: () => Messages.appearance(),
          path: "appearance-settings",
          component: <AppearanceSettings />,
          // This is the appearance settings but technically right now it's only used for language selection
          // so we should hide it if the flag is not enabled.
          hidden: () => !configFlags.enableI18n,
        },
        {
          name: () => Messages.advanced(),
          path: "advanced-settings",
          component: <AdvancedAppSettings />,
        },
      ],
    },
    {
      items: [
        {
          name: () => Messages.help(),
          path: "help",
          component: <HelpPage />,
        },
      ],
    },
  ];

  const Page = () => <SettingsPage settings={settings} />;

  return { Page };
}
