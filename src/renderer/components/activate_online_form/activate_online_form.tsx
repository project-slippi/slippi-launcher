import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import log from "electron-log";
import React, { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";

import { refreshUserData, useAccount } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { validateConnectCodeStart } from "@/lib/validate/validate";
import { useServices } from "@/services";

import { ActivateOnlineFormMessages as Messages } from "./activate_online_form.messages";

export const ActivateOnlineForm = ({ onSubmit }: { onSubmit?: () => void }) => {
  const user = useAccount((store) => store.user);
  const { slippiBackendService } = useServices();
  const refreshActivation = useCallback(() => {
    void refreshUserData(slippiBackendService);
  }, [slippiBackendService]);
  return (
    <div>
      <div>{Messages.yourConnectCodeDescription()}</div>
      <ConnectCodeSetter displayName={user ? user.displayName : null} onSuccess={onSubmit || refreshActivation} />
    </div>
  );
};

type ConnectCodeSetterProps = {
  displayName: string | null;
  onSuccess: () => void;
};

const ConnectCodeSetter = ({ displayName, onSuccess }: ConnectCodeSetterProps) => {
  const { slippiBackendService } = useServices();
  const { showError } = useToasts();
  const getStartTag = () => {
    const safeName = displayName ?? "";
    const matches = safeName.match(/[a-zA-Z]+/g) || [];
    return matches.join("").toUpperCase().substring(0, 4);
  };

  const [isLoading, setIsLoading] = React.useState(false);

  const { handleSubmit, control } = useForm<{ tag: string }>({
    defaultValues: { tag: getStartTag() },
  });

  const onFormSubmit = handleSubmit(({ tag }) => {
    setIsLoading(true);

    slippiBackendService
      .initializeNetplay(tag)
      .then(
        () => {
          onSuccess();
          setIsLoading(false);
        },
        (err) => {
          log.error(err);
          showError(err);
          setIsLoading(false);
        },
      )
      .catch(log.error);
  });

  return (
    <form onSubmit={onFormSubmit}>
      <Typography component="div" variant="body2" color="textSecondary">
        <ul>
          <li>{Messages.twoToFourCharacters()}</li>
          <li>{Messages.trailingNumbers()}</li>
          <li>{Messages.canBeChanged()}</li>
        </ul>
      </Typography>
      <Controller
        name="tag"
        control={control}
        defaultValue=""
        render={({ field, fieldState: { error } }) => {
          return (
            <div
              css={css`
                text-align: center;
              `}
            >
              <TextField
                {...field}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                required={true}
                autoFocus={true}
                css={css`
                  max-width: 200px;
                `}
                inputProps={{
                  maxLength: 4,
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">#123</InputAdornment>,
                }}
                variant="outlined"
                error={Boolean(error)}
              />
              {error && <ErrorContainer>{error.message}</ErrorContainer>}
            </div>
          );
        }}
        rules={{
          validate: (val) => validateConnectCodeStart(val),
        }}
      />
      <div
        css={css`
          display: flex;
          flex-direction: column;
          margin-left: auto;
          margin-right: auto;
          margin-top: 20px;
          max-width: 400px;
        `}
      >
        <Button variant="contained" color="primary" size="large" disabled={isLoading} type="submit">
          {isLoading ? <CircularProgress color="inherit" size={29} /> : Messages.confirmCode()}
        </Button>
      </div>
    </form>
  );
};

const ErrorContainer = styled.div`
  margin: 5px 0;
  font-size: 13px;
  color: ${({ theme }) => theme.palette.error.main};
`;
