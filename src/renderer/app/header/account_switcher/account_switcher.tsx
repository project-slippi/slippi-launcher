import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@mui/icons-material/Add";
import ButtonBase from "@mui/material/ButtonBase";
import type { StoredAccount } from "@settings/types";
import React from "react";

import { UserIcon } from "@/components/user_icon";
import { colors } from "@/styles/colors";

import { AccountSwitcherMessages as Messages } from "./account_switcher.messages";

const AccountItem = styled(ButtonBase, {
  shouldForwardProp: (prop) => prop !== "$active",
})<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 10px;
  justify-content: flex-start;
  border-radius: 4px;
  transition: background-color 100ms ease-in;

  &:hover {
    background-color: rgba(92, 19, 148, 0.1);
  }

  ${(props) =>
    props.$active &&
    `
    font-weight: 500;
  `}
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
`;

const AccountName = styled.div`
  font-size: 16px;
  font-weight: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: left;
`;

const SectionDivider = styled.div`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
`;

const ActionButton = styled(ButtonBase)`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  gap: 8px;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 100ms ease-in;

  &:hover {
    background-color: rgba(92, 19, 148, 0.1);
  }

  svg {
    font-size: 20px;
  }
`;

const AccountEmail = styled.div`
  font-size: 14px;
  color: ${colors.textDim};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export interface AccountSwitcherProps {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
  switching?: boolean;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
  switching = false,
}) => {
  // Filter out active account (already shown in header) and sort by last active
  const sortedAccounts = React.useMemo(() => {
    return [...accounts]
      .filter((account) => account.id !== activeAccountId)
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }, [accounts, activeAccountId]);

  const handleAccountClick = (accountId: string) => {
    if (!switching) {
      onSwitchAccount(accountId);
    }
  };

  return (
    <div
      css={css`
        min-width: 280px;
        color: white;
      `}
    >
      {/* Account List */}
      {sortedAccounts.length > 0 && (
        <>
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 2px;
            `}
          >
            {sortedAccounts.map((account) => (
              <AccountItem
                key={account.id}
                $active={false}
                onClick={() => handleAccountClick(account.id)}
                disabled={switching}
              >
                <UserIcon imageUrl={account.displayPicture} size={32} />
                <AccountInfo>
                  <AccountName>{account.displayName}</AccountName>
                  <AccountEmail>{account.email}</AccountEmail>
                </AccountInfo>
              </AccountItem>
            ))}
          </div>

          <SectionDivider />
        </>
      )}

      {/* Add Account Button */}
      <ActionButton onClick={onAddAccount}>
        <AddIcon />
        {Messages.addAccount()}
      </ActionButton>
    </div>
  );
};
