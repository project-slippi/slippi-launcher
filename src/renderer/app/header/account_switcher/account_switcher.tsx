import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AddIcon from "@mui/icons-material/Add";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import React from "react";

import { UserIcon } from "@/components/user_icon";
import type { StoredAccount } from "@/services/auth/types";
import { colors } from "@/styles/colors";

import { AccountSwitcherMessages as Messages } from "./account_switcher.messages";

const TOP_ACCOUNTS_TO_SHOW = 3;

const AccountItem = styled(ButtonBase)<{ $active?: boolean }>`
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

const ActiveIndicator = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.$active ? colors.purple : colors.textGray)};
  background-color: ${(props) => (props.$active ? colors.purple : "transparent")};
  flex-shrink: 0;
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

const ConnectCode = styled.div`
  font-size: 14px;
  color: ${colors.purpleLight};
  font-weight: normal;
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

export interface AccountSwitcherProps {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onManageAccounts: () => void;
  switching?: boolean;
  connectCode?: string;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
  onManageAccounts,
  switching = false,
  connectCode,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Sort accounts by last active (most recent first)
  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => {
      // Active account always first
      if (a.id === activeAccountId) return -1;
      if (b.id === activeAccountId) return 1;
      // Then by last active
      return b.lastActive.getTime() - a.lastActive.getTime();
    });
  }, [accounts, activeAccountId]);

  // Determine which accounts to show
  const visibleAccounts = expanded ? sortedAccounts : sortedAccounts.slice(0, TOP_ACCOUNTS_TO_SHOW);
  const hiddenCount = sortedAccounts.length - TOP_ACCOUNTS_TO_SHOW;
  const shouldShowExpandButton = sortedAccounts.length > TOP_ACCOUNTS_TO_SHOW;

  const handleAccountClick = (accountId: string) => {
    if (accountId !== activeAccountId && !switching) {
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
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 2px;
        `}
      >
        {visibleAccounts.map((account) => {
          const isActive = account.id === activeAccountId;

          return (
            <AccountItem
              key={account.id}
              $active={isActive}
              onClick={() => handleAccountClick(account.id)}
              disabled={switching}
            >
              <ActiveIndicator $active={isActive} />
              <UserIcon imageUrl={account.displayPicture} size={32} />
              <AccountInfo>
                <AccountName>{account.displayName || account.email}</AccountName>
                {isActive && connectCode && <ConnectCode>{connectCode}</ConnectCode>}
              </AccountInfo>
              {switching && isActive && <CircularProgress size={16} color="inherit" />}
            </AccountItem>
          );
        })}
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

      {/* Actions */}
      <div
        css={css`
          display: flex;
          gap: 4px;
        `}
      >
        <ActionButton onClick={onAddAccount} css={css`flex: 1;`}>
          <AddIcon />
          {Messages.addAccount()}
        </ActionButton>
        <ActionButton onClick={onManageAccounts} css={css`flex: 1;`}>
          <SettingsIcon />
          {Messages.manageAccounts()}
        </ActionButton>
      </div>
    </div>
  );
};

