import styled from "@emotion/styled";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import HelpIcon from "@mui/icons-material/Help";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import log from "electron-log";
import debounce from "lodash/debounce";
import React from "react";
import { useQuery } from "react-query";

import { useServices } from "@/services";

import { StartBroadcastDialogMessages as Messages } from "./start_broadcast_dialog.messages";

// These are the default params for broadcasting Netplay Dolphin
const DEFAULT_IP = "127.0.0.1";
const DEFAULT_PORT = 51441;

type StartBroadcastDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { ip: string; port: number; viewerId: string; connectionType: "dolphin" | "console" }) => void;
};

export const StartBroadcastDialog = ({ open, onClose, onSubmit }: StartBroadcastDialogProps) => {
  const { slippiBackendService } = useServices();
  const [viewerId, setViewerId] = React.useState("");
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const userQuery = useQuery(
    ["userId", viewerId],
    async () => {
      // First check that the user id is only alphanumeric
      if (!viewerId.match(/^[0-9a-zA-Z]+$/)) {
        throw new Error(Messages.invalidUserIdFormat());
      }
      console.log("starting fetch: ", JSON.stringify(new Date()));
      const result = await slippiBackendService.validateUserId(viewerId);
      console.log("finished fetch: ", JSON.stringify(new Date()));
      return result;
    },
    {
      enabled: false, // We want to manually choose when to fetch the user
      retry: false, // react-query auto retries on error'd queries
    },
  );

  const fetchUser = debounce(async () => {
    await userQuery.refetch();
  }, 200);

  const handleChange = React.useCallback(
    (inputText: string) => {
      // First clear the react-query state
      userQuery.remove();
      setViewerId(inputText);
      void fetchUser();
    },
    [fetchUser, userQuery],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      connectionType: formData.get("connectionType") as "dolphin" | "console",
      ip: formData.get("ip") as string,
      port: Number(formData.get("port")),
      viewerId,
    });
    onClose();
  };

  const showErrorStatus = viewerId.length > 0 && userQuery.isError;
  if (showErrorStatus) {
    log.error(`could not get details about spectator: ${userQuery.error}`);
  }

  return (
    <Dialog
      open={open}
      fullWidth={true}
      fullScreen={fullScreen}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle>
          Start Broadcast
          <Tooltip title={Messages.theUniqueViewerCodeOfTheSpectator()}>
            <HelpIcon style={{ marginLeft: 10, opacity: 0.7 }} fontSize="small" />
          </Tooltip>
        </StyledDialogTitle>

        <DialogContent style={{ display: "flex", flexDirection: "column" }}>
          <FormControl>
            <FormLabel>Connection Type</FormLabel>

            <RadioGroup name="connectionType" row={true}>
              <FormControlLabel value="dolphin" label="dolphin" control={<Radio />} />
              <FormControlLabel value="console" label="console" control={<Radio />} />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>IP Address</FormLabel>
            <TextField name="ip" defaultValue={DEFAULT_IP} />
          </FormControl>

          <FormControl>
            <FormLabel>Port</FormLabel>
            <TextField name="port" defaultValue={DEFAULT_PORT} />
          </FormControl>

          <FormControl>
            <FormLabel>{Messages.spectatorId()}</FormLabel>
            <TextField
              value={viewerId}
              variant="filled"
              style={{ width: "100%", flex: 1 }}
              onChange={(e) => handleChange(e.target.value)}
              error={showErrorStatus}
              helperText={
                userQuery.isSuccess && userQuery.data
                  ? Messages.broadcastToUser(userQuery.data.displayName, userQuery.data.connectCode)
                  : showErrorStatus
                  ? Messages.noAssociatedUserFound()
                  : undefined
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {viewerId.length > 0 ? (
                      <Tooltip title={Messages.clear()}>
                        <IconButton size="small" onClick={() => handleChange("")}>
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={Messages.paste()}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard
                              .readText()
                              .then((text) => {
                                if (text) {
                                  handleChange(text);
                                }
                              })
                              .catch(console.error);
                          }}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
          <div style={{ opacity: viewerId.length === 0 ? 0 : 1 }}>
            <div style={{ margin: 12, marginRight: 0 }}>
              {userQuery.data ? (
                <CheckCircleIcon
                  style={{
                    color: theme.palette.success.main,
                  }}
                />
              ) : userQuery.isError ? (
                <ErrorIcon
                  style={{
                    color: theme.palette.error.main,
                  }}
                />
              ) : (
                <CircularProgress size={27} />
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            {Messages.cancel()}
          </Button>
          <Button color="primary" type="submit">
            {Messages.confirm()}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const StyledDialogTitle = styled(DialogTitle)`
  h2 {
    display: flex;
    align-items: center;
  }
`;
