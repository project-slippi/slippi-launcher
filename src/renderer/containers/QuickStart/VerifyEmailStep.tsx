import { colors } from "@common/colors";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import React, { useEffect } from "react";

import { ExternalLink as A } from "@/components/ExternalLink";
import { useAccount } from "@/lib/hooks/useAccount";
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
};

export const VerifyEmailStep: React.FC = () => {
  const { authService } = useServices();
  const setServerError = useAccount((store) => store.setServerError);
  const setUser = useAccount((store) => store.setUser);
  const user = useAccount((store) => store.user);
  const emailVerificationSent = useAccount((store) => store.emailVerificationSent);
  const setEmailVerificationSent = useAccount((store) => store.setEmailVerificationSent);

  console.log(emailVerificationSent);
  console.log(user);

  const profileUrl = "https://slippi.gg/profile";

  const handleCheckVerification = async () => {
    try {
      const newUser = await authService.reloadUser();
      setUser(newUser);
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  useEffect(() => {
    void (async () => {
      if (user && !user.emailVerified && !emailVerificationSent) {
        try {
          await authService.verifyEmail();
          setEmailVerificationSent(true);
        } catch (err: any) {
          setServerError(err.message);
        }
      }
    })();
  }, [emailVerificationSent, setEmailVerificationSent, setServerError, user, authService]);

  const preVerification = (
    <>
      <div css={classes.instructions}>
        Visit your email, click the link in the verification email, and then check verification
      </div>
      <Button variant="outlined" onClick={handleCheckVerification}>
        Check Verification
      </Button>
      <div css={classes.emailNotFoundContainer}>
        Not finding email?{" "}
        <a href="#" onClick={authService.verifyEmail}>
          send again
        </a>
      </div>
    </>
  );

  const postVerification = (
    <div>
      <CheckCircleOutlineIcon />
      Email verified
    </div>
  );

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        <QuickStartHeader>Verify Email</QuickStartHeader>
        <div css={classes.message}>A confirmation email has been sent to</div>
        <div css={classes.emailContainer}>{user?.email}</div>
        <div css={classes.incorrectEmailContainer}>
          Wrong email? <A href={profileUrl}>change email</A>
        </div>
        {user?.emailVerified ? postVerification : preVerification}
      </Container>
    </Box>
  );
};
