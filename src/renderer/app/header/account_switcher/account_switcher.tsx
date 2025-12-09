import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type { StoredAccount } from "@settings/types";
import React from "react";

import { UserIcon } from "@/components/user_icon";
import { colors } from "@/styles/colors";

import { AccountSwitcherMessages as Messages } from "./account_switcher.messages";

const MAX_ADDITIONAL_ACCOUNTS = 4;

const AccountItem = styled.div<{ $disabled?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 4px 0;
  gap: 10px;
  cursor: ${(props) => (props.$disabled ? "default" : "pointer")};
  opacity: ${(props) => (props.$disabled ? 0.6 : 1)};
  transition: background-color 100ms ease-out;

  &:hover {
    background-color: ${(props) => (props.$disabled ? "transparent" : "rgba(255, 255, 255, 0.05)")};

    .remove-button {
      opacity: ${(props) => (props.$disabled ? 0 : 1)};
    }
  }
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
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
  transition: background-color 100ms ease-out;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const AccountEmail = styled.div`
  font-size: 14px;
  color: ${colors.textDim};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveButton = styled(IconButton)`
  padding: 4px;
  color: ${colors.textDim};
  opacity: 0;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

export interface AccountSwitcherProps {
  accounts: StoredAccount[]; // Only inactive accounts (active account is shown in header)
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onRemoveAccount: (accountId: string) => void;
  switching?: boolean;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  accounts,
  onSwitchAccount,
  onAddAccount,
  onRemoveAccount,
  switching = false,
}) => {
  // Sort accounts by last active (accounts are already filtered to exclude active)
  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }, [accounts]);

  const handleAccountClick = (accountId: string) => {
    if (!switching) {
      onSwitchAccount(accountId);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation(); // Prevent triggering the account switch
    onRemoveAccount(accountId);
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
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 2px;
          `}
        >
          {sortedAccounts.map((account) => (
            <AccountItem key={account.id} onClick={() => handleAccountClick(account.id)} $disabled={switching}>
              <UserIcon imageUrl={account.displayPicture} size={32} />
              <AccountInfo>
                <AccountName>{account.displayName}</AccountName>
                <AccountEmail>{account.email}</AccountEmail>
              </AccountInfo>
              <Tooltip title={Messages.remove()}>
                <RemoveButton className="remove-button" onClick={(e) => handleRemoveClick(e, account.id)} size="small">
                  <CloseIcon sx={{ fontSize: 18 }} />
                </RemoveButton>
              </Tooltip>
            </AccountItem>
          ))}
        </div>
      )}

      {/* Add Account Button */}
      {sortedAccounts.length < MAX_ADDITIONAL_ACCOUNTS && (
        <>
          {sortedAccounts.length > 0 && <SectionDivider />}
          <ActionButton onClick={onAddAccount}>
            <AddIcon sx={{ fontSize: 18 }} />
            {Messages.addAnotherAccount()}
          </ActionButton>
        </>
      )}
    </div>
  );
};
