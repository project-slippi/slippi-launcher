export const AccountSwitcherMessages = {
  addAccount: () => "Add account",
  manageAccounts: () => "Manage accounts",
  showMore: (count: number) => `Show {0} more {0, plural, one {account} other {accounts}}`,
  showLess: () => "Show less",
  switchedTo: (accountName: string) => `Switched to {0}`,
  accountsHeader: () => "ACCOUNTS",
  currentAccountHeader: () => "CURRENT ACCOUNT",
  maxAccountsReached: (max: number) => `Maximum {0} accounts reached. Remove an account to add another.`,
  removeAccount: () => "Remove account",
  lastActive: (timeAgo: string) => `Last active: {0}`,
  removeAccountTitle: () => "Remove Account?",
  removeAccountMessage: (accountName: string) => `Are you sure you want to remove {0}?`,
  removeActiveAccountMessage: (accountName: string, nextAccountName: string) =>
    `You're about to remove {0}, which is currently active. You'll be switched to {1}.`,
  remove: () => "Remove",
  cancel: () => "Cancel",
  accountRemoved: (accountName: string) => `Removed {0}`,
};
