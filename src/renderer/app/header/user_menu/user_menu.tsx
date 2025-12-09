import ButtonBase from "@mui/material/ButtonBase";
import DialogContentText from "@mui/material/DialogContentText";
import Menu from "@mui/material/Menu";
import log from "electron-log";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal/confirmation_modal";
import { useAccount } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";
import { SessionExpiredError } from "@/services/auth/types";

import { AccountSwitcherMessages as AccountMessages } from "../account_switcher/account_switcher.messages";
import { AddAccountDialog } from "../account_switcher/add_account_dialog";
import { ActivateOnlineDialog } from "../activate_online_dialog";
import { NameChangeDialog } from "../name_change_dialog";
import { UserInfo } from "../user_info/user_info";
import { UserMenuMessages as Messages } from "./user_menu.messages";
import { UserMenuItems } from "./user_menu_items";

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
  const [switching, setSwitching] = React.useState(false);
  const [reAuthEmail, setReAuthEmail] = React.useState<string | null>(null);

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
  const multiAccountService = authService.getMultiAccountService();

  // Update accounts in state when they change
  React.useEffect(() => {
    const accountsList = multiAccountService.getAccounts();
    const activeId = multiAccountService.getActiveAccountId();
    setAccounts(accountsList);
    setActiveAccountId(activeId);
  }, [multiAccountService, setAccounts, setActiveAccountId]);

  // Handle account switch
  const handleSwitchAccount = async (accountId: string) => {
    if (switching) {
      return;
    }

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
      // Check if session expired
      if (err instanceof SessionExpiredError) {
        // Show login dialog with pre-filled email
        setReAuthEmail(err.email);
        setOpenAddAccountDialog(true);
      } else {
        showError(err?.message || "Failed to switch account");
        console.error("Failed to switch account:", err);
      }
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

  // Filter out active account - only pass inactive accounts to menu
  const inactiveAccounts = React.useMemo(() => {
    return accounts.filter((account) => account.id !== activeAccountId);
  }, [accounts, activeAccountId]);

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
        transformOrigin={{ vertical: -8, horizontal: "left" }}
        keepMounted={true}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
      >
        <UserMenuItems
          inactiveAccounts={inactiveAccounts}
          onSwitchAccount={handleSwitchAccount}
          onAddAccount={handleAddAccount}
          switching={switching}
          isOnlineActivated={!!userData?.playKey}
          serverError={serverError}
          onActivateOnline={() => {
            closeMenu();
            setOpenActivationDialog(true);
          }}
          onViewProfile={() => {
            const profileUrl = `https://slippi.gg/user/${userData?.playKey?.connectCode.replace("#", "-")}`;
            void window.electron.shell.openExternal(profileUrl).catch(log.error);
            closeMenu();
          }}
          onManageAccount={() => {
            const manageUrl = `https://slippi.gg/manage?expectedUid=${user.uid}`;
            void window.electron.shell.openExternal(manageUrl).catch(log.error);
            closeMenu();
          }}
          onEditDisplayName={() => {
            closeMenu();
            setOpenNameChangePrompt(true);
          }}
          onLogout={() => {
            closeMenu();
            setOpenLogoutPrompt(true);
          }}
        />
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
        onClose={() => {
          setOpenAddAccountDialog(false);
          setReAuthEmail(null);
        }}
        onSuccess={() => {
          if (multiAccountService) {
            const accountsList = multiAccountService.getAccounts();
            const activeId = multiAccountService.getActiveAccountId();
            setAccounts(accountsList);
            setActiveAccountId(activeId);
          }
          setReAuthEmail(null);
        }}
        defaultEmail={reAuthEmail}
      />
    </div>
  );
};
