import { slippiManagePage } from "@common/constants";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Button from "@mui/material/Button";
import { useEffect } from "react";

import { ExternalLink as A } from "@/components/external_link";
import { useAccount } from "@/lib/hooks/use_account";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";

import { VerifyEmailFormMessages as Messages } from "./verify_email_form.messages";
import styles from "./verify_email_form.module.css";

export function VerifyEmailForm() {
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
      <div className={styles.instructions}>{Messages.visitYourEmail()}</div>
      <Button variant="outlined" onClick={handleCheckVerification}>
        {Messages.checkVerification()}
      </Button>
      <div className={styles.emailNotFoundContainer}>
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
    <div className={styles.confirmationContainer}>
      <CheckCircleOutlineIcon />
      {Messages.emailVerified()}
    </div>
  );

  return (
    <div>
      <div className={styles.message}>{Messages.aConfirmationEmailHasBeenSentTo()}</div>
      <div className={styles.emailContainer}>{user.email}</div>
      <div className={styles.incorrectEmailContainer}>
        {Messages.wrongEmail()} <A href={slippiManagePage}>{Messages.changeEmail()}</A>
      </div>
      {user.emailVerified ? postVerification : preVerification}
    </div>
  );
}
