import Menu from "@mui/material/Menu";
import type { StoredAccount } from "@settings/types";
import { action } from "@storybook/addon-actions";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { generateDisplayPicture } from "@/lib/display_picture";
import type { AuthUser } from "@/services/auth/types";

import { UserMenuItems } from "./user_menu_items";

export default {
  title: "containers/Header/UserMenuItems",
  component: UserMenuItems,
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Menu open={true} onClose={() => {}}>
          <Story />
        </Menu>
      </div>
    ),
  ],
} as ComponentMeta<typeof UserMenuItems>;

const Template: ComponentStory<typeof UserMenuItems> = (args) => <UserMenuItems {...args} />;

const mockUser: AuthUser = {
  uid: "abc123",
  displayName: "Player1",
  displayPicture: generateDisplayPicture("abc123"),
  email: "player1@example.com",
  emailVerified: true,
};

const mockUserData = {
  uid: "abc123",
  playKey: {
    uid: "abc123",
    connectCode: "PLAY#123",
  },
};

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

// Default Story - Single account, activated (no other accounts to switch to)
export const SingleAccount = Template.bind({});
SingleAccount.args = {
  hasMultiAccount: false,
  inactiveAccounts: [], // No inactive accounts - only the active one shown in header
  onSwitchAccount: action("onSwitchAccount"),
  onAddAccount: action("onAddAccount"),
  switching: false,
  userData: mockUserData,
  serverError: false,
  onClose: action("onClose"),
  onActivateOnline: action("onActivateOnline"),
  user: mockUser,
  onEditDisplayName: action("onEditDisplayName"),
  onLogout: action("onLogout"),
};

// Not activated (no play key)
export const NotActivated = Template.bind({});
NotActivated.args = {
  ...SingleAccount.args,
  userData: { uid: "abc123" },
};

// Server error
export const ServerError = Template.bind({});
ServerError.args = {
  ...SingleAccount.args,
  serverError: true,
};

// Two accounts (1 active in header + 1 inactive shown in menu)
export const TwoAccounts = Template.bind({});
TwoAccounts.args = {
  ...SingleAccount.args,
  hasMultiAccount: true,
  inactiveAccounts: [mockAccounts[1]], // Only the second account (first is active in header)
};

// Three accounts (1 active in header + 2 inactive shown in menu)
export const ThreeAccounts = Template.bind({});
ThreeAccounts.args = {
  ...SingleAccount.args,
  hasMultiAccount: true,
  inactiveAccounts: mockAccounts.slice(1), // Show 2nd and 3rd accounts (first is active in header)
};

// Five accounts (1 active in header + 4 inactive shown in menu)
export const FiveAccounts = Template.bind({});
FiveAccounts.args = {
  ...SingleAccount.args,
  hasMultiAccount: true,
  inactiveAccounts: [
    mockAccounts[1], // 2nd account
    mockAccounts[2], // 3rd account
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
  ], // Show 4 inactive accounts (first is active in header)
};

// Two accounts, currently switching
export const Switching = Template.bind({});
Switching.args = {
  ...TwoAccounts.args,
  switching: true,
};

// Two accounts, active account not activated
export const MultiAccountNotActivated = Template.bind({});
MultiAccountNotActivated.args = {
  ...TwoAccounts.args,
  userData: { uid: "abc123" }, // No playKey - not activated
};
