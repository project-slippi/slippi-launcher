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
import log from "electron-log";
import React from "react";

import type { AuthUser } from "@/services/auth/types";

import { AccountSwitcher } from "../account_switcher/account_switcher";
import { UserMenuMessages as Messages } from "./user_menu.messages";

export interface UserMenuItemsProps {
  hasMultiAccount: boolean;
  inactiveAccounts: StoredAccount[]; // Only inactive accounts (active account shown in header)
  onSwitchAccount: (accountId: string) => void;
  onAddAccount: () => void;
  switching: boolean;
  userData: any;
  serverError: boolean;
  onClose: () => void;
  onActivateOnline: () => void;
  user: AuthUser;
  onEditDisplayName: () => void;
  onLogout: () => void;
}

export const UserMenuItems: React.FC<UserMenuItemsProps> = ({
  hasMultiAccount,
  inactiveAccounts,
  onSwitchAccount,
  onAddAccount,
  switching,
  userData,
  serverError,
  onClose,
  onActivateOnline,
  user,
  onEditDisplayName,
  onLogout,
}) => {
  return (
    <>
      {/* Account Switcher (if multi-account enabled and has inactive accounts) */}
      {hasMultiAccount && inactiveAccounts.length > 0 && (
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
      {!userData?.playKey && !serverError && (
        <MenuItem
          onClick={() => {
            onClose();
            onActivateOnline();
          }}
        >
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={Messages.activateOnlinePlay()} />
        </MenuItem>
      )}

      {userData && userData.playKey && (
        <>
          <MenuItem
            onClick={() => {
              const profileUrl = `https://slippi.gg/user/${userData.playKey!.connectCode.replace("#", "-")}`;
              window.electron.shell.openExternal(profileUrl).catch(log.error);
              onClose();
            }}
          >
            <ListItemIcon>
              <AccountBoxIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.viewProfile()} />
          </MenuItem>
          <MenuItem
            onClick={() => {
              const manageUrl = `https://slippi.gg/manage?expectedUid=${user.uid}`;
              window.electron.shell.openExternal(manageUrl).catch(log.error);
              onClose();
            }}
          >
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.manageAccount()} />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onClose();
              onEditDisplayName();
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.editDisplayName()} />
          </MenuItem>
        </>
      )}

      <MenuItem
        onClick={() => {
          onClose();
          onLogout();
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={Messages.logout()} />
      </MenuItem>
    </>
  );
};
