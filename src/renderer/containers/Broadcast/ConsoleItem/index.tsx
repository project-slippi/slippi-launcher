import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardHeader from "@material-ui/core/CardHeader";
import { red } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import React from "react";

import { ReactComponent as DolphinIcon } from "@/styles/images/dolphin.svg";

import { StartBroadcastDialog } from "./StartBroadcastDialog";

export interface ConsoleItemProps {
  name: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: 345,
    },
    media: {
      height: 0,
      paddingTop: "56.25%", // 16:9
    },
    expand: {
      transform: "rotate(0deg)",
      marginLeft: "auto",
      transition: theme.transitions.create("transform", {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: "rotate(180deg)",
    },
    avatar: {
      backgroundColor: red[500],
    },
    actions: {
      justifyContent: "flex-end",
    },
  }),
);

export const ConsoleItem: React.FC<ConsoleItemProps> = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClose = () => setAnchorEl(null);

  return (
    <div>
      <Card className={classes.root}>
        <CardHeader
          avatar={<DolphinIcon fill="white" height="40px" width="40px" />}
          action={
            <IconButton aria-label="settings" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          }
          title="Slippi Dolphin"
          subheader="127.0.0.1:12345"
        />
        <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={handleClose}>Configure</MenuItem>
          <MenuItem onClick={handleClose}>Delete</MenuItem>
        </Menu>
        <CardActions disableSpacing className={classes.actions}>
          <Button size="small" color="primary" onClick={() => setModalOpen(true)}>
            Broadcast
          </Button>
        </CardActions>
      </Card>
      <StartBroadcastDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(userId) => console.log(`broadcasting to user: ${userId}`)}
      />
    </div>
  );
};
