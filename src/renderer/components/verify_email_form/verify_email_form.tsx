import { slippiManagePage } from "@common/constants";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Button from "@mui/material/Button";
import { useEffect } from "react";

import { ExternalLink as A } from "@/components/external_link";
import { useLocalStorage } from "@/lib/hooks/use_local_storage";
import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import type { AuthUser } from "@/services/auth/types";

import { VerifyEmailFormMessages as Messages } from "./verify_email_form.messages";
import styles from "./verify_email_form.module.css";

const VERIFICATION_EMAIL_SENT_KEY = "verificationEmailSentByUser";

export function VerifyEmailForm({ user }: { user: AuthUser }) {
  const { authService } = useServices();
  const { showError } = useToasts();
  const [sentByUser, setSentByUser] = useLocalStorage<Record<string, boolean>>(VERIFICATION_EMAIL_SENT_KEY, {});
  const emailVerificationSent = sentByUser[user.uid] ?? false;

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
        setSentByUser((prev) => ({ ...prev, [user.uid]: true }));
      } catch (err: any) {
        showError(err.message);
      }
    };

    if (user && !user.emailVerified && !emailVerificationSent) {
      void sendVerificationEmail();
    }
  }, [emailVerificationSent, setSentByUser, showError, user, authService]);

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
