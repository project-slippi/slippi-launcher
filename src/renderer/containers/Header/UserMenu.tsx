import firebase from "firebase";
import React from "react";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import { deletePlayKey } from "@/lib/playkey";
import { UserInfo } from "./UserInfo";

export const UserMenu: React.FC<{
  user: firebase.User;
  handleError: (error: any) => void;
}> = ({ user, handleError }) => {
  const [openLogoutPrompt, setOpenLogoutPrompt] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const onLogout = async () => {
    handleClose();
    await deletePlayKey();
    try {
      await firebase.auth().signOut();
    } catch (err) {
      handleError(err);
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
    setOpenLogoutPrompt(false);
  };
  return (
    <div>
      <ButtonBase onClick={handleClick}>
        <UserInfo user={user} />
      </ButtonBase>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            setOpenLogoutPrompt(true);
          }}
        >
          Logout
        </MenuItem>
      </Menu>
      <Dialog
        fullScreen={fullScreen}
        open={openLogoutPrompt}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          Are you sure you want to log out?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will need to log in again next time you want to play.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onLogout} color="primary">
            Log out
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
