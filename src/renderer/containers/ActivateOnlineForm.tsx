/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useToasts } from "react-toast-notifications";

import { useAccount } from "@/lib/hooks/useAccount";
import { initNetplay } from "@/lib/slippiBackend";
import { validateConnectCodeStart } from "@/lib/validate";

const log = console;

export const ActivateOnlineForm: React.FC<{ onSubmit?: () => void }> = ({ onSubmit }) => {
  const user = useAccount((store) => store.user);
  const refreshActivation = useAccount((store) => store.refreshPlayKey);
  return (
    <div>
      <div>Your connect code is used for players to connect with you directly.</div>
      <ConnectCodeSetter displayName={user ? user.displayName : null} onSuccess={onSubmit || refreshActivation} />
    </div>
  );
};

interface ConnectCodeSetterProps {
  displayName: string | null;
  onSuccess: () => void;
}

const ConnectCodeSetter: React.FC<ConnectCodeSetterProps> = ({ displayName, onSuccess }) => {
  const { addToast } = useToasts();
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

    initNetplay(tag).then(
      () => {
        onSuccess();
        setIsLoading(false);
      },
      (err: Error) => {
        log.error(err);
        addToast(err.message ?? JSON.stringify(err), {
          appearance: "error",
        });
        setIsLoading(false);
      },
    );
  });

  return (
    <form onSubmit={onFormSubmit}>
      <Typography component="div" variant="body2" color="textSecondary">
        <ul>
          <li>2-4 uppercase English characters</li>
          <li>Trailing numbers will be auto-generated</li>
          <li>Can be changed later for a one-time payment</li>
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
          {isLoading ? <CircularProgress color="inherit" size={29} /> : "Confirm code"}
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
