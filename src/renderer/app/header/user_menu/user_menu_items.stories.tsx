import Menu from "@mui/material/Menu";
import type { StoredAccount } from "@settings/types";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { action } from "storybook/actions";

import { generateDisplayPicture } from "@/lib/display_picture";

import { UserMenuItems } from "./user_menu_items";

const meta = {
  title: "containers/Header/UserMenuItems",
  component: UserMenuItems,
  decorators: [
    (Story) => (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Menu open={true} onClose={() => {}}>
          <Story />
        </Menu>
      </div>
    ),
  ],
} satisfies Meta<typeof UserMenuItems>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockAccounts: StoredAccount[] = [
  {
    id: "abc123",
    email: "player1@example.com",
    displayName: "Player1",
    displayPicture: generateDisplayPicture("abc123"),
    lastActive: new Date("2025-12-09T10:00:00Z"),
  },
  {
    id: "def456",
    email: "falco@example.com",
    displayName: "FalcoMain",
    displayPicture: generateDisplayPicture("def456"),
    lastActive: new Date("2025-12-08T15:30:00Z"),
  },
  {
    id: "ghi789",
    email: "fox@example.com",
    displayName: "FoxMaster",
    displayPicture: generateDisplayPicture("ghi789"),
    lastActive: new Date("2025-12-07T09:15:00Z"),
  },
];

// No inactive accounts to switch to (1 total account - active one shown in header)
export const NoInactiveAccounts: Story = {
  args: {
    inactiveAccounts: [],
    onSwitchAccount: action("onSwitchAccount"),
    onAddAccount: action("onAddAccount"),
    onRemoveAccount: action("onRemoveAccount"),
    switching: false,
    isOnlineActivated: true,
    serverError: false,
    onActivateOnline: action("onActivateOnline"),
    onViewProfile: action("onViewProfile"),
    onManageAccount: action("onManageAccount"),
    onEditDisplayName: action("onEditDisplayName"),
    onLogout: action("onLogout"),
  },
};

// Not activated (no play key)
export const NotActivated: Story = {
  args: {
    ...NoInactiveAccounts.args,
    isOnlineActivated: false,
  },
};

// Server error
export const ServerError: Story = {
  args: {
    ...NoInactiveAccounts.args,
    serverError: true,
  },
};

// 1 inactive account shown in switcher (2 total accounts)
export const OneInactiveAccount: Story = {
  args: {
    ...NoInactiveAccounts.args,
    inactiveAccounts: [mockAccounts[1]],
  },
};

// 2 inactive accounts shown in switcher (3 total accounts)
export const TwoInactiveAccounts: Story = {
  args: {
    ...NoInactiveAccounts.args,
    inactiveAccounts: mockAccounts.slice(1),
  },
};

// 4 inactive accounts shown in switcher (5 total accounts - max)
export const FourInactiveAccounts: Story = {
  args: {
    ...NoInactiveAccounts.args,
    inactiveAccounts: [
      mockAccounts[1],
      mockAccounts[2],
      {
        id: "jkl012",
        email: "marth@example.com",
        displayName: "MarthPro",
        displayPicture: generateDisplayPicture("jkl012"),
        lastActive: new Date("2025-12-06T12:00:00Z"),
      },
      {
        id: "mno345",
        email: "sheik@example.com",
        displayName: "SheikPlayer",
        displayPicture: generateDisplayPicture("mno345"),
        lastActive: new Date("2025-12-05T18:45:00Z"),
      },
    ],
  },
};

// Switching between accounts (shows loading state)
export const SwitchingAccounts: Story = {
  args: {
    ...OneInactiveAccount.args,
    switching: true,
  },
};

// Multiple accounts but active account not activated
export const MultiAccountNotActivated: Story = {
  args: {
    ...OneInactiveAccount.args,
    isOnlineActivated: false, // Not activated - no playKey
  },
};
