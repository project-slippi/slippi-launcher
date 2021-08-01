/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import CheckCircleOutline from "@material-ui/icons/CheckCircleOutline";
import ErrorOutline from "@material-ui/icons/ErrorOutline";
import Alert from "@material-ui/lab/Alert";
import electronLog from "electron-log";
import firebase from "firebase";
import React from "react";

import { useAccount } from "@/lib/hooks/useAccount";
import { initNetplay } from "@/lib/slippiBackend";

const log = electronLog.scope("ActivateOnlineForm");
export interface ActivateOnlineFormProps {
  className?: string;
  hideRetry?: boolean;
}

const useStyles = makeStyles((theme) => ({
  largeButton: {
    marginTop: "10px",
  },
  connectCodeInput: {
    maxWidth: "220px",
    marginTop: "10px",
    marginBottom: "4px",
  },
  dottedList: {
    paddingLeft: "33px",
    margin: "6px 0",
  },
  listItem: {
    margin: "4px 0",
  },
  codeErrorMessage: {
    marginTop: "8px",
  },
  error: {
    color: theme.palette.error.light,
  },
  success: {
    color: theme.palette.success.light,
  },
  working: {
    color: theme.palette.text.secondary,
  },
}));

export const ActivateOnlineForm: React.FC<ActivateOnlineFormProps> = ({ className }) => {
  const user = useAccount((store) => store.user) as firebase.User;
  const refreshActivation = useAccount((store) => store.refreshPlayKey);
  return (
    <div className={className}>
      <div>Your connect code is the way other players will connect to you directly.</div>
      <ConnectCodeSetter user={user} onSuccess={refreshActivation} />
    </div>
  );
};

interface ConnectCodeSetterProps {
  user: firebase.User;
  onSuccess: () => void;
}

const ConnectCodeSetter: React.FC<ConnectCodeSetterProps> = ({ user, onSuccess }) => {
  const classes = useStyles();

  const getStartTag = (displayName: string | null) => {
    const safeName = displayName || "";
    const matches = safeName.match(/[a-zA-Z]+/g) || [];
    return matches.join("").toUpperCase().substring(0, 4);
  };

  const startTag = getStartTag(user.displayName);

  const [tag, setTag] = React.useState(startTag);
  const [isWorking, setIsWorking] = React.useState(false);
  const [errMessage, setErrMessage] = React.useState("");
  const [tagState, setTagState] = React.useState("short");

  // Handle checking availability on tag change
  const prevTagRef = React.useRef();
  React.useEffect(() => {
    const prevTag = prevTagRef.current;
    ((prevTagRef.current as unknown) as string) = tag;

    // If tag hasn't changed, do nothing
    if (prevTag === tag) {
      return;
    }

    const state = tag.length < 2 ? "short" : "valid";
    setTagState(state);
  }, [tag, user.uid]);

  const handleTagChange = (event: any) => {
    let newTag = event.target.value;

    // Only allow english characters and capitalize them
    const safeTag = newTag || "";
    const matches = safeTag.match(/[a-zA-Z]+/g) || [];
    newTag = matches.join("").toUpperCase().substring(0, 4);
    event.target.value = newTag;

    setTag(newTag);
    setErrMessage("");
  };

  const onConfirmTag = () => {
    setErrMessage("");
    setIsWorking(true);

    initNetplay(tag).then(
      () => {
        onSuccess();
        setIsWorking(false);
      },
      (err: Error) => {
        setErrMessage(err.message);
        log.error(err);
        setIsWorking(false);
      },
    );
  };

  const connectCodeField = (
    <TextField
      className={classes.connectCodeInput}
      key="connectCode"
      name="connectCode"
      id="connectCode"
      label="Connect Code"
      defaultValue={startTag}
      InputProps={{
        endAdornment: <InputAdornment position="end">#123</InputAdornment>,
      }}
      variant="outlined"
      onChange={handleTagChange}
    />
  );

  const renderTagState = () => {
    let icon, text;
    switch (tagState) {
      case "short":
        icon = <ErrorOutline />;
        text = "Too Short";
        break;
      case "valid":
        icon = <CheckCircleOutline />;
        text = "Valid";
        break;
      default:
        return null;
    }

    return (
      <div
        css={css`
          margin: 15px 0px 0px 5px;
          display: flex;
        `}
      >
        {icon}
        <Typography
          variant="body2"
          css={css`
            margin: 4px 0px 0px 5px;
          `}
        >
          {text}
        </Typography>
      </div>
    );
  };

  let errorDisplay = null;
  if (errMessage) {
    errorDisplay = (
      <Alert className={classes.codeErrorMessage} variant="outlined" severity="error">
        {errMessage}
      </Alert>
    );
  }

  return (
    <form>
      <Typography component="div" variant="body2" color="textSecondary">
        <ul className={classes.dottedList}>
          <li className={classes.listItem}>2-4 uppercase english characters</li>
          <li className={classes.listItem}>Trailing numbers will be auto-generated</li>
        </ul>
      </Typography>
      <div
        css={css`
          display: flex;
        `}
      >
        {connectCodeField}
        {renderTagState()}
      </div>
      <Button
        className={classes.largeButton}
        variant="contained"
        color="primary"
        size="large"
        onClick={onConfirmTag}
        disabled={tagState !== "valid" || isWorking}
      >
        {isWorking ? <CircularProgress color="inherit" size={29} /> : "Confirm Code"}
      </Button>
      {errorDisplay}
    </form>
  );
};
