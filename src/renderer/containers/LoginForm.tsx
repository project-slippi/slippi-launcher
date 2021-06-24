/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import firebase from "firebase";
import React from "react";
import create from "zustand";
import { combine } from "zustand/middleware";

import { login, signUp } from "@/lib/firebase";
import { useAsync } from "@/lib/hooks/useAsync";

// Store this data in a hook so we can avoid dealing with setting state on unmount errors
const useLoginStore = create(
  combine(
    {
      email: "",
      password: "",
      confirmPassword: "",
    },
    (set) => ({
      setEmail: (email: string) => set({ email }),
      setPassword: (password: string) => set({ password }),
      setConfirmPassword: (confirmPassword: string) => set({ confirmPassword }),
    }),
  ),
);

const useStyles = makeStyles(() => ({
  cssLabel: {
    color: "#dddddd",
    "&.Mui-focused": {
      color: "#ffffff",
    },
  },
}));

export interface LoginFormProps {
  isSignUp?: boolean;
  className?: string;
  disableAutoFocus?: boolean;
  onSuccess?: () => void;
  toggleSignUp: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  className,
  onSuccess,
  disableAutoFocus,
  isSignUp,
  toggleSignUp,
}) => {
  const email = useLoginStore((store) => store.email);
  const setEmail = useLoginStore((store) => store.setEmail);
  const password = useLoginStore((store) => store.password);
  const setPassword = useLoginStore((store) => store.setPassword);
  const confirmPassword = useLoginStore((store) => store.confirmPassword);
  const setConfirmPassword = useLoginStore((store) => store.setConfirmPassword);
  const [showPassword, setShowPassword] = React.useState(false);
  const classes = useStyles();

  const { execute, loading, error } = useAsync(async () => {
    let user: firebase.auth.UserCredential;
    if (isSignUp) {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      user = await signUp(email, password);
    } else {
      user = await login(email, password);
    }
    if (user) {
      // Clear the form
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        onSuccess();
      }
    }
  });

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        void execute();
      }}
    >
      <Grid container alignItems="flex-end">
        <Grid item md={true} sm={true} xs={true}>
          <TextField
            disabled={loading}
            label="Email"
            variant="filled"
            value={email}
            autoFocus={!disableAutoFocus}
            fullWidth={true}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
            InputLabelProps={{
              classes: {
                root: classes.cssLabel,
              },
            }}
          />
        </Grid>
      </Grid>
      <Grid container alignItems="flex-end" style={{ marginTop: 15 }}>
        <Grid item md={true} sm={true} xs={true}>
          <TextField
            disabled={loading}
            variant="filled"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={!isSignUp && showPassword ? "text" : "password"}
            fullWidth={true}
            required={true}
            InputLabelProps={{
              classes: {
                root: classes.cssLabel,
              },
            }}
            InputProps={{
              endAdornment: !isSignUp ? (
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ) : undefined,
            }}
          />
        </Grid>
      </Grid>
      {isSignUp && (
        <Grid container alignItems="flex-end" style={{ marginTop: 15 }}>
          <Grid item md={true} sm={true} xs={true}>
            <TextField
              disabled={loading}
              variant="filled"
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={"password"}
              fullWidth={true}
              required={true}
              InputLabelProps={{
                classes: {
                  root: classes.cssLabel,
                },
              }}
            />
          </Grid>
        </Grid>
      )}
      {error && (
        <Grid>
          <p>{error.message}</p>
        </Grid>
      )}
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
          margin-bottom: 10px;
        `}
      >
        <Button
          color="secondary"
          onClick={toggleSignUp}
          size="small"
          css={css`
            text-transform: initial;
            font-size: 14px;
          `}
        >
          {isSignUp ? "I already have an account" : "Create an account"}
        </Button>
        <Button type="submit" color="primary" disabled={loading} variant="contained">
          {isSignUp ? "Sign up" : "Log in"}
        </Button>
      </div>
    </form>
  );
};
