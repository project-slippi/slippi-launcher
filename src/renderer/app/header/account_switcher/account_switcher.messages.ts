export const AccountSwitcherMessages = {
  addAccount: () => "Add account",
  manageAccounts: () => "Manage accounts",
  showMore: (count: number) => `Show ${count} more account${count > 1 ? "s" : ""}`,
  showLess: () => "Show less",
  switchedTo: (accountName: string) => `Switched to ${accountName}`,
  accountsHeader: () => "ACCOUNTS",
  currentAccountHeader: () => "CURRENT ACCOUNT",
  maxAccountsReached: (max: number) => `Maximum ${max} accounts reached. Remove an account to add another.`,
  removeAccount: () => "Remove account",
  lastActive: (timeAgo: string) => `Last active: ${timeAgo}`,
  removeAccountTitle: () => "Remove Account?",
  removeAccountMessage: (accountName: string) => `Are you sure you want to remove ${accountName}?`,
  removeActiveAccountMessage: (accountName: string, nextAccountName: string) =>
    `You're about to remove ${accountName}, which is currently active. You'll be switched to ${nextAccountName}.`,
  remove: () => "Remove",
  cancel: () => "Cancel",
  accountRemoved: (accountName: string) => `Removed ${accountName}`,
};

