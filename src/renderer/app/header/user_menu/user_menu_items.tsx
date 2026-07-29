import styled from "@emotion/styled";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import type { StoredAccount } from "@settings/types";

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
  isEmailVerified: boolean; // Whether the user has verified their email
  serverError: boolean;
  onActivateOnline: () => void;
  onViewProfile: () => void;
  onManageAccount: () => void;
  onEditDisplayName: () => void;
  onVerifyEmail: () => void;
  onLogout: () => void;
};

export const UserMenuItems = ({
  inactiveAccounts,
  onSwitchAccount,
  onAddAccount,
  onRemoveAccount,
  switching,
  isOnlineActivated,
  isEmailVerified,
  serverError,
  onActivateOnline,
  onViewProfile,
  onManageAccount,
  onEditDisplayName,
  onVerifyEmail,
  onLogout,
}: UserMenuItemsProps) => {
  return (
    <>
      {/* Account Switcher (if has inactive accounts to switch to) */}
      <AccountSwitcher
        accounts={inactiveAccounts}
        onSwitchAccount={onSwitchAccount}
        onAddAccount={onAddAccount}
        onRemoveAccount={onRemoveAccount}
        switching={switching}
      />
      <SectionDivider />

      {/* Current Account Options */}
      {!isOnlineActivated && !serverError && (
        <MenuItem onClick={onActivateOnline}>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ListItemText primary={Messages.activateOnlinePlay()} />
            <RedDot />
          </div>
        </MenuItem>
      )}

      {!isEmailVerified && (
        <MenuItem onClick={onVerifyEmail}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ListItemText primary={Messages.verifyEmail()} />
            <RedDot />
          </div>
        </MenuItem>
      )}

      {isOnlineActivated && (
        <>
          <MenuItem onClick={onViewProfile}>
            <ListItemIcon>
              <AccountBoxIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.viewProfile()} />
            <OpenInNewIcon fontSize="small" />
          </MenuItem>
          <MenuItem onClick={onManageAccount}>
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={Messages.manageAccount()} />
            <OpenInNewIcon fontSize="small" />
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

function RedDot({ size = 10 }: { size?: number }) {
  return (
    <div
      style={{
        backgroundColor: "var(--red-error)",
        height: size,
        width: size,
        borderRadius: "50%",
      }}
    />
  );
}
