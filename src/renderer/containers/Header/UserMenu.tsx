import EditIcon from "@mui/icons-material/Edit";
import EjectIcon from "@mui/icons-material/Eject";
import LanguageIcon from "@mui/icons-material/Language";
import ButtonBase from "@mui/material/ButtonBase";
import DialogContentText from "@mui/material/DialogContentText";
import React from "react";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import type { IconMenuItem } from "@/components/IconMenu";
import { IconMenu } from "@/components/IconMenu";
import { useAccount } from "@/lib/hooks/useAccount";
import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";

import { ActivateOnlineDialog } from "./ActivateOnlineDialog";
import { NameChangeDialog } from "./NameChangeDialog";
import { UserInfo } from "./UserInfo/UserInfo";

export const UserMenu: React.FC<{
  user: AuthUser;
  handleError: (error: any) => void;
}> = ({ user, handleError }) => {
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
        label: "Activate online play",
      });
    }

    if (userData) {
      items.push({
        onClick: () => {
          closeMenu();
          setOpenNameChangePrompt(true);
        },
        label: "Edit display name",
        icon: <EditIcon fontSize="small" />,
      });
    }

    items.push({
      onClick: () => {
        closeMenu();
        setOpenLogoutPrompt(true);
      },
      label: "Log out",
      icon: <EjectIcon fontSize="small" style={{ transform: "rotate(270deg)" }} />,
    });
    return items;
  };

  let errMessage: string | undefined = undefined;
  if (serverError) {
    errMessage = "Slippi server error";
  } else if (!userData?.playKey) {
    errMessage = "Online activation required";
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
        keepMounted
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
        title="Are you sure you want to log out?"
        confirmText="Log out"
        open={openLogoutPrompt}
        onClose={handleClose}
        onSubmit={onLogout}
        fullWidth={false}
      >
        <DialogContentText>You will need to log in again next time you want to play.</DialogContentText>
      </ConfirmationModal>
    </div>
  );
};
