/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import electronLog from "electron-log";
import firebase from "firebase";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { useAccount } from "@/lib/hooks/useAccount";
import { initNetplay } from "@/lib/slippiBackend";
import { isValidConnectCodeStart } from "@/lib/validate";

const log = electronLog.scope("ActivateOnlineForm");

export const ActivateOnlineForm: React.FC = () => {
  const user = useAccount((store) => store.user) as firebase.User;
  const refreshActivation = useAccount((store) => store.refreshPlayKey);
  return (
    <div>
      <div>Your connect code is used for players to connect with you directly.</div>
      <ConnectCodeSetter displayName={user.displayName || ""} onSuccess={refreshActivation} />
    </div>
  );
};

interface ConnectCodeSetterProps {
  displayName: string;
  onSuccess: () => void;
}

const ConnectCodeSetter: React.FC<ConnectCodeSetterProps> = ({ displayName, onSuccess }) => {
  const getStartTag = () => {
    const safeName = displayName;
    const matches = safeName.match(/[a-zA-Z]+/g) || [];
    return matches.join("").toUpperCase().substring(0, 4);
  };

  const [isLoading, setIsLoading] = React.useState(false);
  const [errMessage, setErrMessage] = React.useState("");

  const { handleSubmit, control } = useForm<{ tag: string }>({
    defaultValues: { tag: getStartTag() },
  });

  const onFormSubmit = handleSubmit(({ tag }) => {
    setErrMessage("");
    setIsLoading(true);

    initNetplay(tag).then(
      () => {
        onSuccess();
        setIsLoading(false);
      },
      (err: Error) => {
        setErrMessage(err.message);
        log.error(err);
        setIsLoading(false);
      },
    );
  });

  let errorDisplay = null;
  if (errMessage) {
    errorDisplay = (
      <Alert
        css={css`
          margin-top: 8px;
        `}
        variant="outlined"
        severity="error"
      >
        {errMessage}
      </Alert>
    );
  }

  return (
    <form className="form" onSubmit={onFormSubmit}>
      <Typography component="div" variant="body2" color="textSecondary">
        <ul
          css={css`
            padding-left: 33px;
            margin: 6px 0;
          `}
        >
          <StyledListItem>2-4 uppercase English characters</StyledListItem>
          <StyledListItem>Trailing numbers will be auto-generated</StyledListItem>
          <StyledListItem>Can be changed later for a one-time payment</StyledListItem>
        </ul>
      </Typography>
      <div
        css={css`
          display: flex;
          margin-left: auto;
          margin-right: auto;
          width: 400px;
          height: 150px;
          flex-direction: column;
          position: relative;
        `}
      >
        <Controller
          name="tag"
          control={control}
          defaultValue=""
          render={({ field, fieldState: { error } }) => {
            return (
              <TextField
                {...field}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                required={true}
                css={css`
                  max-width: 200px;
                  margin: 20px auto 10px auto;
                  padding-bottom: 20px;
                `}
                inputProps={{
                  maxLength: 4,
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">#123</InputAdornment>,
                }}
                variant="outlined"
                error={Boolean(error)}
                helperText={error ? error.message : undefined}
              />
            );
          }}
          rules={{
            validate: (val) => isValidConnectCodeStart(val),
          }}
        />

        <Button
          css={css`
            margin: 10px auto 0 auto;
            position: absolute;
            width: 400px;
            bottom: 0px;
          `}
          variant="contained"
          color="primary"
          size="large"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? <CircularProgress color="inherit" size={29} /> : "Confirm code"}
        </Button>
      </div>
      {errorDisplay}
    </form>
  );
};

const StyledListItem = styled.li`
  margin: 4px 0;
`;
