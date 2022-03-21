import styled from "@emotion/styled";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import HelpIcon from "@mui/icons-material/Help";
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
import debounce from "lodash/debounce";
import React from "react";
import { useQuery } from "react-query";

import { useServices } from "@/services";

const log = window.electron.log;
export interface StartBroadcastDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export const StartBroadcastDialog: React.FC<StartBroadcastDialogProps> = ({ open, onClose, onSubmit }) => {
  const { slippiBackendService } = useServices();
  const [value, setValue] = React.useState("");
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const userQuery = useQuery(
    ["userId", value],
    async () => {
      // First check that the user id is only alphanumeric
      if (!value.match(/^[0-9a-zA-Z]+$/)) {
        throw new Error("Invalid user ID format");
      }
      console.log("starting fetch: ", JSON.stringify(new Date()));
      const result = await slippiBackendService.validateUserId(value);
      console.log("finished fetch: ", JSON.stringify(new Date()));
      return result;
    },
    {
      enabled: false, // We want to manually choose when to fetch the user
      retry: false, // react-query auto retries on error'd queries
    },
  );

  const fetchUser = debounce(async () => {
    console.log("start debounced code");
    await userQuery.refetch();
    console.log("end debounced code");
  }, 200);

  const handleChange = React.useCallback(
    (inputText: string) => {
      // First clear the react-query state
      userQuery.remove();
      setValue(inputText);
      void fetchUser();
    },
    [fetchUser, userQuery],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitting form...");
    onSubmit(value);
    onClose();
  };

  const showErrorStatus = value.length > 0 && userQuery.isError;
  if (showErrorStatus) {
    log.error(`could not get details about spectator: ${userQuery.error}`);
  }

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
      fullWidth={true}
      fullScreen={fullScreen}
    >
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle>
          Enter Spectator ID
          <Tooltip title="The unique viewer code of the spectator.">
            <HelpIcon style={{ marginLeft: 10, opacity: 0.7 }} fontSize="small" />
          </Tooltip>
        </StyledDialogTitle>
        <DialogContent style={{ display: "flex" }}>
          <TextField
            label="Spectator ID"
            value={value}
            variant="filled"
            style={{ width: "100%", flex: 1 }}
            onChange={(e) => handleChange(e.target.value)}
            error={showErrorStatus}
            helperText={
              userQuery.isSuccess && userQuery.data
                ? `Broadcast to ${userQuery.data.displayName} (${userQuery.data.connectCode})`
                : showErrorStatus
                ? "No associated user found"
                : undefined
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {value.length > 0 ? (
                    <Tooltip title="Clear">
                      <IconButton size="small" onClick={() => handleChange("")}>
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Paste">
                      <IconButton
                        size="small"
                        onClick={() => {
                          const text = window.electron.clipboard.readText();
                          if (text) {
                            handleChange(text);
                          }
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
          <div style={{ opacity: value.length === 0 ? 0 : 1 }}>
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
            Cancel
          </Button>
          <Button color="primary" disabled={!userQuery.isSuccess} type="submit">
            Confirm
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
