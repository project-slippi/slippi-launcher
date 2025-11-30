import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import React from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useAsync } from "@/lib/hooks/use_async";
import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";

import { LoginFormMessages as Messages } from "./login_form.messages";

// Store this data in a hook so we can avoid dealing with setting state on unmount errors
const useLoginStore = create(
  combine(
    {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
    (set) => ({
      setEmail: (email: string) => set({ email }),
      setDisplayName: (displayName: string) => set({ displayName }),
      setPassword: (password: string) => set({ password }),
      setConfirmPassword: (confirmPassword: string) => set({ confirmPassword }),
    }),
  ),
);

const Header = styled.h2`
  font-weight: normal;
  margin: 0;
  margin-bottom: 15px;
`;

type LoginFormProps = {
  className?: string;
  disableAutoFocus?: boolean;
  onSuccess?: () => void;
};

export const LoginForm = ({ className, onSuccess, disableAutoFocus }: LoginFormProps) => {
  const { authService } = useServices();
  const email = useLoginStore((store) => store.email);
  const setEmail = useLoginStore((store) => store.setEmail);
  const displayName = useLoginStore((store) => store.displayName);
  const setDisplayName = useLoginStore((store) => store.setDisplayName);
  const password = useLoginStore((store) => store.password);
  const setPassword = useLoginStore((store) => store.setPassword);
  const confirmPassword = useLoginStore((store) => store.confirmPassword);
  const setConfirmPassword = useLoginStore((store) => store.setConfirmPassword);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordResetForm, setShowPasswordResetForm] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const toggleSignUp = () => setIsSignUp(!isSignUp);

  const { execute, loading, error, clearError } = useAsync(async () => {
    let user: AuthUser | null;
    if (isSignUp) {
      if (password !== confirmPassword) {
        throw new Error(Messages.passwordsDoNotMatch());
      }
      user = await authService.signUp({ email: email.trim(), displayName, password });
    } else {
      user = await authService.login({ email: email.trim(), password });
    }
    if (user) {
      // Clear the form
      setEmail("");
      setDisplayName("");
      setPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        onSuccess();
      }
    }
  });

  // Reset the error state when changing form type
  React.useEffect(() => {
    clearError();
  }, [showPasswordResetForm, isSignUp, clearError]);

  if (showPasswordResetForm) {
    return <ForgotPasswordForm onClose={() => setShowPasswordResetForm(false)} />;
  }

  return (
    <div className={className}>
      <Header>{isSignUp ? Messages.createAnAccount() : Messages.logIn()}</Header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void execute();
        }}
      >
        <div
          css={css`
            display: grid;
            grid-template-columns: 100%;
            grid-gap: 15px;
          `}
        >
          {isSignUp && (
            <TextField
              disabled={loading}
              label={Messages.displayName()}
              variant="filled"
              value={displayName}
              autoFocus={!disableAutoFocus}
              fullWidth={true}
              required={true}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <TextField
            disabled={loading}
            label={Messages.email()}
            variant="filled"
            value={email}
            autoFocus={!disableAutoFocus}
            fullWidth={true}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            disabled={loading}
            variant="filled"
            label={Messages.password()}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={!isSignUp && showPassword ? "text" : "password"}
            fullWidth={true}
            required={true}
            InputProps={{
              endAdornment: !isSignUp ? (
                <IconButton
                  title={Messages.togglePasswordVisibility()}
                  aria-label={Messages.togglePasswordVisibility()}
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  edge="end"
                  size="large"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ) : undefined,
            }}
          />
          {isSignUp && (
            <TextField
              disabled={loading}
              variant="filled"
              label={Messages.confirmPassword()}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              fullWidth={true}
              required={true}
            />
          )}
        </div>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <div
          css={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
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
            {isSignUp ? Messages.alreadyHaveAnAccount() : Messages.createAnAccount()}
          </Button>
          <Button type="submit" color="primary" disabled={loading} variant="contained">
            {isSignUp ? Messages.signUp() : Messages.logIn()}
          </Button>
        </div>
        {!isSignUp && (
          <div
            css={css`
              text-align: right;
            `}
          >
            <Button
              color="secondary"
              onClick={() => setShowPasswordResetForm(true)}
              size="small"
              css={css`
                text-transform: initial;
                font-size: 12px;
              `}
            >
              {Messages.forgotPassword()}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

const ForgotPasswordForm = ({ className, onClose }: { className?: string; onClose: () => void }) => {
  const { authService } = useServices();
  const email = useLoginStore((store) => store.email);
  const setEmail = useLoginStore((store) => store.setEmail);
  const [success, setSuccess] = React.useState(false);

  const { execute, loading, error } = useAsync(async () => {
    setSuccess(false);
    await authService.resetPassword(email);
    setSuccess(true);
  });

  return (
    <div className={className}>
      <Header>{Messages.passwordReset()}</Header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (success) {
            onClose();
          } else {
            void execute();
          }
        }}
      >
        {success ? (
          <div>{Messages.passwordResetInstructionsSent(email)}</div>
        ) : (
          <TextField
            disabled={loading}
            label={Messages.email()}
            variant="filled"
            value={email}
            autoFocus={false}
            fullWidth={true}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <div
          css={css`
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: 20px;
            margin-bottom: 10px;
          `}
        >
          <Button type="submit" color="primary" disabled={loading} variant="contained">
            {success ? Messages.continue() : Messages.reset()}
          </Button>
        </div>
        {!success && (
          <div
            css={css`
              text-align: right;
            `}
          >
            <Button
              color="secondary"
              onClick={onClose}
              size="small"
              css={css`
                text-transform: initial;
                font-size: 12px;
              `}
            >
              {Messages.goBack()}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

const ErrorMessage = styled.div`
  margin-top: 10px;
  color: ${({ theme }) => theme.palette.error.main};
  font-size: 14px;
`;
