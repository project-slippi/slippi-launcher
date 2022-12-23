import { colors } from "@common/colors";
import { slippiManagePage } from "@common/constants";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import React, { useEffect } from "react";

import { ExternalLink as A } from "@/components/ExternalLink";
import { useAccount } from "@/lib/hooks/useAccount";
import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";

import { QuickStartHeader } from "./QuickStartHeader";

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

const classes = {
  message: css`
    color: ${colors.textSecondary};
  `,
  emailContainer: css`
    background: ${colors.purpleDark};
    padding: 10px 20px;
    border-radius: 5px;
    margin: 10px;
    width: fit-content;
    font-size: 20px;
  `,
  incorrectEmailContainer: css`
    margin-top: -5px;
    margin-left: 10px;
    font-size: 14px;
    color: ${colors.textDim};
    > a {
      color: ${colors.purplePrimary};
    }
  `,
  instructions: css`
    margin-top: 25px;
    margin-bottom: 10px;
    color: ${colors.textSecondary};
  `,
  emailNotFoundContainer: css`
    margin-top: 4px;
    font-size: 14px;
    color: ${colors.textDim};
    > a {
      color: ${colors.purplePrimary};
    }
  `,
  confirmationContainer: css`
    margin-top: 30px;
    font-size: 28px;
    color: ${colors.greenPrimary};
    display: grid;
    align-items: center;
    gap: 8px;
    grid-template-columns: auto auto 1fr;
    > svg {
      font-size: 40px;
    }
  `,
};

export const VerifyEmailStep: React.FC = () => {
  const { authService } = useServices();
  const { showError } = useToasts();
  const user = useAccount((store) => store.user);
  const emailVerificationSent = useAccount((store) => store.emailVerificationSent);
  const setEmailVerificationSent = useAccount((store) => store.setEmailVerificationSent);

  const handleCheckVerification = async () => {
    try {
      await authService.refreshUser();

      // Get current user manually since the user variable above hasn't updated yet
      const newUser = authService.getCurrentUser();
      if (!newUser?.emailVerified) {
        showError("Email is not yet verified. Have you checked your spam folder?");
      }
    } catch (err: any) {
      showError(err.message);
    }
  };

  useEffect(() => {
    const sendVerificationEmail = async () => {
      try {
        await authService.sendVerificationEmail();
        setEmailVerificationSent(true);
      } catch (err: any) {
        showError(err.message);
      }
    };

    if (user && !user.emailVerified && !emailVerificationSent) {
      void sendVerificationEmail();
    }
  }, [emailVerificationSent, setEmailVerificationSent, showError, user, authService]);

  const preVerification = (
    <>
      <div css={classes.instructions}>
        Visit your email, click the link in the verification email, and then check verification
      </div>
      <Button variant="outlined" onClick={handleCheckVerification}>
        Check Verification
      </Button>
      <div css={classes.emailNotFoundContainer}>
        Can't find the email? Check your spam folder. Still missing?{" "}
        <a href="#" onClick={authService.sendVerificationEmail}>
          send again
        </a>
      </div>
    </>
  );

  const postVerification = (
    <div css={classes.confirmationContainer}>
      <CheckCircleOutlineIcon />
      Email verified
    </div>
  );

  let stepBody = null;
  if (user) {
    stepBody = (
      <>
        <div css={classes.message}>A confirmation email has been sent to</div>
        <div css={classes.emailContainer}>{user.email}</div>
        <div css={classes.incorrectEmailContainer}>
          Wrong email? <A href={slippiManagePage}>change email</A>
        </div>
        {user.emailVerified ? postVerification : preVerification}
      </>
    );
  } else {
    stepBody = <div>An error occurred. The application does not have a user.</div>;
  }

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Verify your email</QuickStartHeader>
        {stepBody}
      </Container>
    </Box>
  );
};
