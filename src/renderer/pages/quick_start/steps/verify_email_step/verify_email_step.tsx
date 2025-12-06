import { slippiManagePage } from "@common/constants";
import { css } from "@emotion/react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Button from "@mui/material/Button";
import { useEffect } from "react";

import { ExternalLink as A } from "@/components/external_link";
import { useAccount } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import { colors } from "@/styles/colors";

import { StepContainer } from "../../step_container";
import { VerifyEmailStepMessages as Messages } from "./verify_email_step.messages";

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

export const VerifyEmailStep = () => {
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
        showError(Messages.emailIsNotVerified());
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
      <div css={classes.instructions}>{Messages.visitYourEmail()}</div>
      <Button variant="outlined" onClick={handleCheckVerification}>
        {Messages.checkVerification()}
      </Button>
      <div css={classes.emailNotFoundContainer}>
        {Messages.cantFindEmail()}{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void authService.sendVerificationEmail();
          }}
        >
          {Messages.sendAgain()}
        </a>
      </div>
    </>
  );

  const postVerification = (
    <div css={classes.confirmationContainer}>
      <CheckCircleOutlineIcon />
      {Messages.emailVerified()}
    </div>
  );

  let stepBody = null;
  if (user) {
    stepBody = (
      <>
        <div css={classes.message}>{Messages.aConfirmationEmailHasBeenSentTo()}</div>
        <div css={classes.emailContainer}>{user.email}</div>
        <div css={classes.incorrectEmailContainer}>
          {Messages.wrongEmail()} <A href={slippiManagePage}>{Messages.changeEmail()}</A>
        </div>
        {user.emailVerified ? postVerification : preVerification}
      </>
    );
  } else {
    stepBody = <div>{Messages.errorMissingUser()}</div>;
  }

  return <StepContainer header={Messages.verifyYourEmail()}>{stepBody}</StepContainer>;
};
