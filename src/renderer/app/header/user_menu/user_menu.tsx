import AccountBoxIcon from "@mui/icons-material/AccountBox";
import EditIcon from "@mui/icons-material/Edit";
import LanguageIcon from "@mui/icons-material/Language";
import LogoutIcon from "@mui/icons-material/Logout";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ButtonBase from "@mui/material/ButtonBase";
import DialogContentText from "@mui/material/DialogContentText";
import log from "electron-log";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal/confirmation_modal";
import type { IconMenuItem } from "@/components/icon_menu";
import { IconMenu } from "@/components/icon_menu";
import { useAccount } from "@/lib/hooks/use_account";
import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";

import { ActivateOnlineDialog } from "../activate_online_dialog";
import { NameChangeDialog } from "../name_change_dialog";
import { UserInfo } from "../user_info/user_info";
import { UserMenuMessages as Messages } from "./user_menu.messages";

export const UserMenu = ({ user, handleError }: { user: AuthUser; handleError: (error: any) => void }) => {
  const { authService } = useServices();
  const userData = useAccount((store) => store.userData);
  const displayName = useAccount((store) => store.displayName);
  const loading = useAccount((store) => store.loading);
  const serverError = useAccount((store) => store.serverError);
  const [openLogoutPrompt, setOpenLogoutPrompt] = React.useState(false);
  const [openNameChangePrompt, setOpenNameChangePrompt] = React.useState(false);
  const [openActivationDialog, setOpenActivationDialog] = React.useState(false);
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

  const generateMenuItems = (): IconMenuItem[] => {
    const items: IconMenuItem[] = [];

    if (!userData?.playKey && !serverError) {
      items.push({
        onClick: () => {
          closeMenu();
          setOpenActivationDialog(true);
        },
        icon: <LanguageIcon fontSize="small" />,
        label: Messages.activateOnlinePlay(),
      });
    }

    if (userData && userData.playKey) {
      const profileUrl = `https://slippi.gg/user/${userData.playKey.connectCode.replace("#", "-")}`;
      items.push(
        {
          onClick: () => {
            window.electron.shell.openExternal(profileUrl).catch(log.error);
            closeMenu();
          },
          label: Messages.viewProfile(),
          icon: <AccountBoxIcon fontSize="small" />,
          external: true,
        },
        {
          onClick: () => {
            const manageUrl = `https://slippi.gg/manage?expectedUid=${user.uid}`;
            window.electron.shell.openExternal(manageUrl).catch(log.error);
            closeMenu();
          },
          label: Messages.manageAccount(),
          icon: <ManageAccountsIcon fontSize="small" />,
          external: true,
        },
        {
          onClick: () => {
            closeMenu();
            setOpenNameChangePrompt(true);
          },
          label: Messages.editDisplayName(),
          icon: <EditIcon fontSize="small" />,
        },
      );
    }

    items.push({
      onClick: () => {
        closeMenu();
        setOpenLogoutPrompt(true);
      },
      label: Messages.logout(),
      icon: <LogoutIcon fontSize="small" />,
    });
    return items;
  };

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
      <IconMenu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        keepMounted={true}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        items={generateMenuItems()}
      />
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
    </div>
  );
};
