import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@mui/icons-material/Add";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import ButtonBase from "@mui/material/ButtonBase";
import type { StoredAccount } from "@settings/types";
import React from "react";

import { UserIcon } from "@/components/user_icon";
import { colors } from "@/styles/colors";

import { AccountSwitcherMessages as Messages } from "./account_switcher.messages";

const TOP_ACCOUNTS_TO_SHOW = 3;

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
  justify-content: flex-start;
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

const ExpandButton = styled(ButtonBase)`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  color: ${colors.purpleLight};
  transition: background-color 100ms ease-in;

  &:hover {
    background-color: rgba(92, 19, 148, 0.1);
  }

  svg {
    font-size: 18px;
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
  onManageAccounts: () => void;
  switching?: boolean;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
  onManageAccounts,
  switching = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Filter out active account (already shown in header) and sort by last active
  const sortedAccounts = React.useMemo(() => {
    return [...accounts]
      .filter((account) => account.id !== activeAccountId)
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }, [accounts, activeAccountId]);

  // Determine which accounts to show
  const visibleAccounts = expanded ? sortedAccounts : sortedAccounts.slice(0, TOP_ACCOUNTS_TO_SHOW);
  const hiddenCount = sortedAccounts.length - TOP_ACCOUNTS_TO_SHOW;
  const shouldShowExpandButton = sortedAccounts.length > TOP_ACCOUNTS_TO_SHOW;

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
            {visibleAccounts.map((account) => (
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
          {/* Expand/Collapse Button */}
          {shouldShowExpandButton && (
            <ExpandButton onClick={() => setExpanded(!expanded)}>
              {expanded ? (
                <>
                  <ExpandLessIcon />
                  {Messages.showLess()}
                </>
              ) : (
                <>
                  <ExpandMoreIcon />
                  {Messages.showMore(hiddenCount)}
                </>
              )}
            </ExpandButton>
          )}

          <SectionDivider />
        </>
      )}

      {/* Actions */}
      <div
        css={css`
          display: flex;
          gap: 4px;
        `}
      >
        <ActionButton
          onClick={onAddAccount}
          css={css`
            flex: 1;
          `}
        >
          <AddIcon />
          {Messages.addAccount()}
        </ActionButton>
        <ActionButton
          onClick={onManageAccounts}
          css={css`
            flex: 1;
          `}
        >
          <SettingsIcon />
          {Messages.manageAccounts()}
        </ActionButton>
      </div>
    </div>
  );
};
