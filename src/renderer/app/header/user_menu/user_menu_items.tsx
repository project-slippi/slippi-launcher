import { css } from "@emotion/react";
import styled from "@emotion/styled";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EditIcon from "@mui/icons-material/Edit";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import type { StoredAccount } from "@settings/types";
import React from "react";

import { AccountSwitcher } from "../account_switcher/account_switcher";
import { UserMenuMessages as Messages } from "./user_menu.messages";

const SectionDivider = styled.div`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
`;

type UserMenuItemsProps = {
  inactiveAccounts: StoredAccount[]; // Only inactive accounts (active account shown in header)
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
  onRemoveAccount: (accountId: string) => void;
  switching: boolean;
  isOnlineActivated: boolean; // Whether the user has activated online play (has playKey)
  serverError: boolean;
  onActivateOnline: () => void;
  onViewProfile: () => void;
  onManageAccount: () => void;
  onEditDisplayName: () => void;
  onLogout: () => void;
};

export const UserMenuItems = ({
  inactiveAccounts,
  onSwitchAccount,
  onAddAccount,
  onRemoveAccount,
  switching,
  isOnlineActivated,
  serverError,
  onActivateOnline,
  onViewProfile,
  onManageAccount,
  onEditDisplayName,
  onLogout,
}: UserMenuItemsProps) => {
  return (
    <>
      {/* Account Switcher (if has inactive accounts to switch to) */}
      <div
        css={css`
          padding: 0 8px;
        `}
      >
        <AccountSwitcher
          accounts={inactiveAccounts}
          onSwitchAccount={onSwitchAccount}
          onAddAccount={onAddAccount}
          onRemoveAccount={onRemoveAccount}
          switching={switching}
        />
      </div>
      <SectionDivider />

      {/* Current Account Options */}
      {!isOnlineActivated && !serverError && (
        <MenuItem onClick={onActivateOnline}>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={Messages.activateOnlinePlay()} />
        </MenuItem>
      )}

      {isOnlineActivated && (
        <>
          <MenuItem onClick={onViewProfile}>
            <ListItemIcon>
              <AccountBoxIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.viewProfile()} />
          </MenuItem>
          <MenuItem onClick={onManageAccount}>
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.manageAccount()} />
          </MenuItem>
          <MenuItem onClick={onEditDisplayName}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.editDisplayName()} />
          </MenuItem>
        </>
      )}

      <MenuItem onClick={onLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={Messages.logout()} />
      </MenuItem>
    </>
  );
};
