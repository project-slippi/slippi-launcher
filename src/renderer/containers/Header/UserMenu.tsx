import ButtonBase from "@material-ui/core/ButtonBase";
import DialogContentText from "@material-ui/core/DialogContentText";
import EditIcon from "@material-ui/icons/Edit";
import EjectIcon from "@material-ui/icons/Eject";
import LanguageIcon from "@material-ui/icons/Language";
import firebase from "firebase";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { IconMenu, IconMenuItem } from "@/components/IconMenu";
import { logout } from "@/lib/firebase";
import { useAccount } from "@/lib/hooks/useAccount";

import { ActivateOnlineDialog } from "./ActivateOnlineDialog";
import { NameChangeDialog } from "./NameChangeDialog";
import { UserInfo } from "./UserInfo";

export const UserMenu: React.FC<{
  user: firebase.User;
  handleError: (error: any) => void;
}> = ({ user, handleError }) => {
  const playKey = useAccount((store) => store.playKey);
  const displayName = useAccount((store) => store.displayName);
  const refreshPlayKey = useAccount((store) => store.refreshPlayKey);
  const loading = useAccount((store) => store.loading);
  const [openLogoutPrompt, setOpenLogoutPrompt] = React.useState(false);
  const [openNameChangePrompt, setOpenNameChangePrompt] = React.useState(false);
  const [openActivationDialog, setOpenActivationDialog] = React.useState(false);
  const { addToast } = useToasts();
  const onLogout = async () => {
    try {
      await logout();
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

    if (!playKey) {
      items.push({
        onClick: () => {
          closeMenu();
          setOpenActivationDialog(true);
        },
        icon: <LanguageIcon fontSize="small" />,
        label: "Activate online play",
      });
    }

    if (playKey) {
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

  return (
    <div>
      <ButtonBase onClick={handleClick}>
        <UserInfo uid={user.uid} displayName={displayName} playKey={playKey} loading={loading} />
      </ButtonBase>
      <IconMenu
        anchorEl={anchorEl}
        getContentAnchorEl={null}
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
          refreshPlayKey().catch((err) => addToast(err.message, { appearance: "error" }));
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
