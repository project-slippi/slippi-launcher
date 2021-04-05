import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import { ConnectionStatus } from "@slippi/slippi-js";
import { isDevelopment } from "common/constants";
import moment from "moment";
import React from "react";
import TimeAgo from "react-timeago";

import { ReactComponent as DolphinIcon } from "@/styles/images/dolphin.svg";

import { StartBroadcastDialog } from "./StartBroadcastDialog";

const skipUserValidation = isDevelopment && !process.env.SLIPPI_USER_SERVER;

export interface ConsoleItemProps {
  name: string;
  ip: string;
  port: number;
  dolphinStatus: ConnectionStatus;
  slippiServerStatus: ConnectionStatus;
  startTime: Date | null;
  endTime: Date | null;
  onStartBroadcast: (viewerId: string) => void;
  onDisconnect: () => void;
}

const useStyles = makeStyles(() =>
  createStyles({
    actions: {
      justifyContent: "flex-end",
    },
  }),
);

export const ConsoleItem: React.FC<ConsoleItemProps> = ({
  name,
  ip,
  port,
  slippiServerStatus,
  dolphinStatus,
  startTime,
  endTime,
  onStartBroadcast,
  onDisconnect,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const classes = useStyles();
  // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isDisconnected =
    slippiServerStatus === ConnectionStatus.DISCONNECTED && dolphinStatus === ConnectionStatus.DISCONNECTED;
  const isConnected = slippiServerStatus === ConnectionStatus.CONNECTED && dolphinStatus === ConnectionStatus.CONNECTED;

  // const handleClose = () => setAnchorEl(null);
  const broadcastDuration = startTime && endTime ? moment.duration(moment(endTime).diff(moment(startTime))) : null;

  return (
    <div>
      <Card>
        <CardHeader
          avatar={<DolphinIcon fill="white" height="40px" width="40px" />}
          // action={
          //   <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          //     <MoreVertIcon />
          //   </IconButton>
          // }
          title={name}
          subheader={`${ip}:${port}`}
        />
        {/* <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem onClick={handleClose}>Configure</MenuItem>
          <MenuItem onClick={handleClose}>Delete</MenuItem>
        </Menu> */}
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            Status: {isConnected ? "Connected" : isDisconnected ? "Disconnected" : "Connecting"}
          </Typography>
          {isConnected && startTime !== null && (
            <Typography variant="body2" color="textSecondary" component="p">
              Broadcast started <TimeAgo date={startTime} />
            </Typography>
          )}
          {isDisconnected && broadcastDuration && (
            <Typography variant="body2" color="textSecondary" component="p">
              Broadcast ended after {broadcastDuration.humanize()}
            </Typography>
          )}
        </CardContent>
        <CardActions disableSpacing className={classes.actions}>
          {isDisconnected ? (
            <Button size="small" color="primary" onClick={() => setModalOpen(true)}>
              Broadcast
            </Button>
          ) : (
            <Button size="small" color="secondary" onClick={onDisconnect}>
              Disconnect
            </Button>
          )}
        </CardActions>
      </Card>
      <StartBroadcastDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onStartBroadcast}
        skipUserValidation={skipUserValidation}
      />
    </div>
  );
};
