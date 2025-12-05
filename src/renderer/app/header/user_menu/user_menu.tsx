import { css } from "@emotion/react";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EditIcon from "@mui/icons-material/Edit";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import DialogContentText from "@mui/material/DialogContentText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import log from "electron-log";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal/confirmation_modal";
import { useAccount } from "@/lib/hooks/use_account";
import { useServices } from "@/services";
import { useToasts } from "@/lib/hooks/use_toasts";
import type { AuthUser } from "@/services/auth/types";

import { AccountSwitcher } from "../account_switcher/account_switcher";
import { AddAccountDialog } from "../account_switcher/add_account_dialog";
import { ManageAccountsDialog } from "../account_switcher/manage_accounts_dialog";
import { AccountSwitcherMessages as AccountMessages } from "../account_switcher/account_switcher.messages";
import { ActivateOnlineDialog } from "../activate_online_dialog";
import { NameChangeDialog } from "../name_change_dialog";
import { UserInfo } from "../user_info/user_info";
import { UserMenuMessages as Messages } from "./user_menu.messages";

const MAX_ACCOUNTS = 5;

export const UserMenu = ({ user, handleError }: { user: AuthUser; handleError: (error: any) => void }) => {
  const { authService, slippiBackendService } = useServices();
  const userData = useAccount((store) => store.userData);
  const displayName = useAccount((store) => store.displayName);
  const loading = useAccount((store) => store.loading);
  const serverError = useAccount((store) => store.serverError);
  const accounts = useAccount((store) => store.accounts);
  const activeAccountId = useAccount((store) => store.activeAccountId);
  const setAccounts = useAccount((store) => store.setAccounts);
  const setActiveAccountId = useAccount((store) => store.setActiveAccountId);
  const { showSuccess, showError } = useToasts();

  const [openLogoutPrompt, setOpenLogoutPrompt] = React.useState(false);
  const [openNameChangePrompt, setOpenNameChangePrompt] = React.useState(false);
  const [openActivationDialog, setOpenActivationDialog] = React.useState(false);
  const [openAddAccountDialog, setOpenAddAccountDialog] = React.useState(false);
  const [openManageAccountsDialog, setOpenManageAccountsDialog] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);

  const onLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error(err);
      handleError(err);
    } finally {
      handleClose();
    }
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchorEl(null);
  };
  const handleClose = () => {
    setOpenNameChangePrompt(false);
    setOpenLogoutPrompt(false);
  };

  // Get multi-account service
  const multiAccountService = authService.getMultiAccountService?.();

  // Update accounts in state when they change
  React.useEffect(() => {
    if (multiAccountService) {
      const accountsList = multiAccountService.getAccounts();
      const activeId = multiAccountService.getActiveAccountId();
      setAccounts(accountsList);
      setActiveAccountId(activeId);
    }
  }, [multiAccountService, setAccounts, setActiveAccountId]);

  // Handle account switch
  const handleSwitchAccount = async (accountId: string) => {
    if (!multiAccountService || switching) return;

    setSwitching(true);
    closeMenu();

    try {
      await multiAccountService.switchAccount(accountId);

      // Update local state
      const accountsList = multiAccountService.getAccounts();
      const activeId = multiAccountService.getActiveAccountId();
      setAccounts(accountsList);
      setActiveAccountId(activeId);

      const account = accountsList.find((acc) => acc.id === accountId);
      if (account) {
        showSuccess(AccountMessages.switchedTo(account.displayName || account.email));
      }

      // Refresh user data for new account
      await slippiBackendService.fetchUserData().catch(() => {
        // Ignore errors here - user data will be fetched by other listeners
      });
    } catch (err: any) {
      showError(err?.message || "Failed to switch account");
      console.error("Failed to switch account:", err);
    } finally {
      setSwitching(false);
    }
  };

  // Handle add account
  const handleAddAccount = () => {
    if (accounts.length >= MAX_ACCOUNTS) {
      showError(AccountMessages.maxAccountsReached(MAX_ACCOUNTS));
      return;
    }

    closeMenu();
    setOpenAddAccountDialog(true);
  };

  // Handle manage accounts
  const handleManageAccounts = () => {
    closeMenu();
    setOpenManageAccountsDialog(true);
  };

  // Handle remove account
  const handleRemoveAccount = async (accountId: string) => {
    if (!multiAccountService) return;

    try {
      await multiAccountService.removeAccount(accountId);

      // Update local state
      const accountsList = multiAccountService.getAccounts();
      const activeId = multiAccountService.getActiveAccountId();
      setAccounts(accountsList);
      setActiveAccountId(activeId);

      const account = accounts.find((acc) => acc.id === accountId);
      if (account) {
        showSuccess(AccountMessages.accountRemoved(account.displayName || account.email));
      }
    } catch (err: any) {
      showError(err?.message || "Failed to remove account");
      console.error("Failed to remove account:", err);
      throw err;
    }
  };

  // Determine if we have multi-account support
  const hasMultiAccount = accounts.length > 0 || multiAccountService !== null;

  let errMessage: string | undefined = undefined;
  if (serverError) {
    errMessage = Messages.slippiServerError();
  } else if (!userData?.playKey) {
    errMessage = Messages.onlineActivationRequired();
  }

  return (
    <div>
      <ButtonBase onClick={handleClick}>
        <UserInfo
          displayName={displayName}
          displayPicture={user.displayPicture}
          connectCode={userData?.playKey?.connectCode}
          errorMessage={errMessage}
          loading={loading}
        />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        keepMounted={true}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
      >
        {/* Account Switcher (if multi-account enabled and has accounts) */}
        {hasMultiAccount && accounts.length > 0 && (
          <>
            <div
              css={css`
                padding: 8px;
              `}
            >
              <AccountSwitcher
                accounts={accounts}
                activeAccountId={activeAccountId}
                onSwitchAccount={handleSwitchAccount}
                onAddAccount={handleAddAccount}
                onManageAccounts={handleManageAccounts}
                switching={switching}
                connectCode={userData?.playKey?.connectCode}
              />
            </div>
            <Divider />
          </>
        )}

        {/* Current Account Options */}
        {!userData?.playKey && !serverError && (
          <MenuItem
            onClick={() => {
              closeMenu();
              setOpenActivationDialog(true);
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
                closeMenu();
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
                closeMenu();
              }}
            >
              <ListItemIcon>
                <ManageAccountsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={Messages.manageAccount()} />
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                setOpenNameChangePrompt(true);
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
            closeMenu();
            setOpenLogoutPrompt(true);
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={Messages.logout()} />
        </MenuItem>
      </Menu>

      <NameChangeDialog displayName={displayName} open={openNameChangePrompt} handleClose={handleClose} />
      <ActivateOnlineDialog
        open={openActivationDialog}
        onClose={() => setOpenActivationDialog(false)}
        onSubmit={() => {
          setOpenActivationDialog(false);
        }}
      />
      <ConfirmationModal
        title={Messages.areYouSureYouWantToLogout()}
        confirmText={Messages.logout()}
        open={openLogoutPrompt}
        onClose={handleClose}
        onSubmit={onLogout}
        fullWidth={false}
      >
        <DialogContentText>{Messages.youWillNeedToLogInAgain()}</DialogContentText>
      </ConfirmationModal>

      {/* Multi-Account Dialogs */}
      <AddAccountDialog
        open={openAddAccountDialog}
        onClose={() => setOpenAddAccountDialog(false)}
        onSuccess={() => {
          if (multiAccountService) {
            const accountsList = multiAccountService.getAccounts();
            const activeId = multiAccountService.getActiveAccountId();
            setAccounts(accountsList);
            setActiveAccountId(activeId);
          }
        }}
      />
      <ManageAccountsDialog
        open={openManageAccountsDialog}
        onClose={() => setOpenManageAccountsDialog(false)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onRemoveAccount={handleRemoveAccount}
        maxAccounts={MAX_ACCOUNTS}
      />
    </div>
  );
};
