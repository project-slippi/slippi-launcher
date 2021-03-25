import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import HelpIcon from "@material-ui/icons/Help";
import debounce from "lodash/debounce";
import React from "react";
import { useQuery } from "react-query";
import styled from "styled-components";

import { validateUserId } from "@/lib/validateUserId";

export interface StartBroadcastDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export const StartBroadcastDialog: React.FC<StartBroadcastDialogProps> = ({ open, onClose, onSubmit }) => {
  const [value, setValue] = React.useState("");
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const userQuery = useQuery(
    ["userId", value],
    async () => {
      console.log("starting fetch: ", JSON.stringify(new Date()));
      const result = await validateUserId(value);
      console.log("finished fetch: ", JSON.stringify(new Date()));
      return result;
    },
    {
      enabled: false, // We want to manually choose when to fetch the user
      retry: false, // react-query auto retries on error'd queries
    },
  );

  const fetchUser = React.useCallback(
    debounce(async () => {
      console.log("start debounced code");
      await userQuery.refetch();
      console.log("end debounced code");
    }, 200),
    [userQuery],
  );

  const handleChange = React.useCallback((inputText: string) => {
    setValue(inputText);
    fetchUser();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitting form...");
    onSubmit(value);
    onClose();
  };

  const showErrorStatus = value.length > 0 && userQuery.isError;
  return (
    <Dialog open={open} onClose={onClose} fullWidth={true} fullScreen={fullScreen} disableBackdropClick={true}>
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle>
          Enter Spectator ID
          <Tooltip title="The unique viewer code of the spectator.">
            <HelpIcon style={{ marginLeft: 10, opacity: 0.7 }} fontSize="small" />
          </Tooltip>
        </StyledDialogTitle>
        <DialogContent>
          <TextField
            id="filled-basic"
            label="Spectator ID"
            variant="filled"
            style={{ width: "100%" }}
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
                <div>
                  {value.length === 0 ? null : userQuery.isLoading ? (
                    <CircularProgress size={27} />
                  ) : userQuery.data ? (
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
                  ) : null}
                </div>
              ),
            }}
          />
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
