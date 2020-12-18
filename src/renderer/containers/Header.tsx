import firebase from "firebase";
import React from "react";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import Modal from "@material-ui/core/Modal";
import Button from "@material-ui/core/Button";
import styled from "styled-components";
import { colors } from "common/colors";
import { UserInfo } from "../components/UserInfo";
import { useApp } from "@/store/app";
import { LoginForm } from "./LoginForm";
import { startGame } from "@/lib/startGame";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ButtonBase from "@material-ui/core/ButtonBase";
import { useModal } from "@/lib/hooks/useModal";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import { deletePlayKey } from "@/lib/playkey";

const OuterBox = styled(Box)`
  background-color: ${colors.purpleDark};
  padding: 5px 10px;
`;

const LoginModal = styled(Paper)`
  max-width: 800px;
  outline: 0;
  width: 100%;
  padding: 50px;
`;

const LoginHeading = styled.h2`
  font-weight: normal;
  margin: 0;
  margin-bottom: 15px;
`;

export const Header: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const currentUser = useApp((store) => store.user);
  const handleError = useApp((state) => state.handleError);
  const onPlay = () => {
    startGame(console.log).catch(handleError);
  };
  return (
    <div>
      <OuterBox
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        {currentUser ? (
          <Button onClick={onPlay}>Play now</Button>
        ) : (
          <Button onClick={() => setOpen(true)}>Log in</Button>
        )}
        {currentUser && <UserMenu user={currentUser}></UserMenu>}
      </OuterBox>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <LoginModal>
          <LoginHeading>Login</LoginHeading>
          <LoginForm onSuccess={() => setOpen(false)} />
        </LoginModal>
      </Modal>
    </div>
  );
};

const UserMenu: React.FC<{
  user: firebase.User;
}> = ({ user }) => {
  const [openLogoutPrompt, setOpenLogoutPrompt] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const handleError = useApp((state) => state.handleError);
  const { open } = useModal("/settings");
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
            open();
          }}
        >
          Settings
        </MenuItem>
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
          <Button autoFocus onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onLogout} color="primary" autoFocus>
            Log out
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
