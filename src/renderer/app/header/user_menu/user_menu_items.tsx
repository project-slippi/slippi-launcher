import { css } from "@emotion/react";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EditIcon from "@mui/icons-material/Edit";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import type { StoredAccount } from "@settings/types";
import React from "react";

import { AccountSwitcher } from "../account_switcher/account_switcher";
import { UserMenuMessages as Messages } from "./user_menu.messages";

export interface UserMenuItemsProps {
  inactiveAccounts: StoredAccount[]; // Only inactive accounts (active account shown in header)
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
  switching: boolean;
  isOnlineActivated: boolean; // Whether the user has activated online play (has playKey)
  serverError: boolean;
  onActivateOnline: () => void;
  onViewProfile: () => void;
  onManageAccount: () => void;
  onEditDisplayName: () => void;
  onLogout: () => void;
}

export const UserMenuItems: React.FC<UserMenuItemsProps> = ({
  inactiveAccounts,
  onSwitchAccount,
  onAddAccount,
  switching,
  isOnlineActivated,
  serverError,
  onActivateOnline,
  onViewProfile,
  onManageAccount,
  onEditDisplayName,
  onLogout,
}) => {
  return (
    <>
      {/* Account Switcher (if has inactive accounts to switch to) */}
      {inactiveAccounts.length > 0 && (
        <>
          <div
            css={css`
              padding: 8px;
            `}
          >
            <AccountSwitcher
              accounts={inactiveAccounts}
              onSwitchAccount={onSwitchAccount}
              onAddAccount={onAddAccount}
              switching={switching}
            />
          </div>
          <Divider />
        </>
      )}

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
