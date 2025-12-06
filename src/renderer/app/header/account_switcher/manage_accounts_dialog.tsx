import { css } from "@emotion/react";
import styled from "@emotion/styled";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { StoredAccount } from "@settings/types";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal/confirmation_modal";
import { UserIcon } from "@/components/user_icon";
import { colors } from "@/styles/colors";

import { AccountSwitcherMessages as Messages } from "./account_switcher.messages";

const AccountListItem = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  border-radius: 8px;
  background-color: ${(props) => (props.$active ? "rgba(92, 19, 148, 0.1)" : "transparent")};
  border: 1px solid ${(props) => (props.$active ? colors.purple : "rgba(255, 255, 255, 0.1)")};
  margin-bottom: 12px;
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const AccountName = styled.div`
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
`;

const AccountEmail = styled.div`
  font-size: 14px;
  color: ${colors.textDim};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LastActive = styled.div`
  font-size: 12px;
  color: ${colors.purpleLight};
  margin-top: 4px;
`;

const ActiveBadge = styled.div`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: ${colors.purple};
  color: white;
  font-weight: 500;
`;

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "just now";
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  }
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}

export interface ManageAccountsDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: StoredAccount[];
  activeAccountId: string | null;
  onRemoveAccount: (accountId: string) => Promise<void>;
  maxAccounts: number;
}

export const ManageAccountsDialog: React.FC<ManageAccountsDialogProps> = ({
  open,
  onClose,
  accounts,
  activeAccountId,
  onRemoveAccount,
  maxAccounts,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = React.useState<StoredAccount | null>(null);

  // Sort accounts: active first, then by last active
  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (a.id === activeAccountId) {
        return -1;
      }
      if (b.id === activeAccountId) {
        return 1;
      }
      return b.lastActive.getTime() - a.lastActive.getTime();
    });
  }, [accounts, activeAccountId]);

  const handleRemoveClick = (account: StoredAccount) => {
    setConfirmRemove(account);
  };

  const handleConfirmRemove = async () => {
    if (!confirmRemove) {
      return;
    }

    setRemoving(confirmRemove.id);
    try {
      await onRemoveAccount(confirmRemove.id);
      setConfirmRemove(null);
    } catch (err) {
      console.error("Failed to remove account:", err);
    } finally {
      setRemoving(null);
    }
  };

  const getNextActiveAccount = (removingId: string): StoredAccount | null => {
    const remaining = sortedAccounts.filter((acc) => acc.id !== removingId);
    return remaining.length > 0 ? remaining[0] : null;
  };

  const isRemovingActive = confirmRemove?.id === activeAccountId;
  const nextAccount = isRemovingActive && confirmRemove ? getNextActiveAccount(confirmRemove.id) : null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth={true} maxWidth="sm" fullScreen={fullScreen}>
        <DialogTitle>Manage Accounts</DialogTitle>
        <DialogContent>
          <div
            css={css`
              padding: 8px 0;
            `}
          >
            {sortedAccounts.map((account) => {
              const isActive = account.id === activeAccountId;
              const isRemoving = removing === account.id;

              return (
                <AccountListItem key={account.id} $active={isActive}>
                  <UserIcon imageUrl={account.displayPicture} size={40} />
                  <AccountInfo>
                    <AccountName>{account.displayName || account.email}</AccountName>
                    <AccountEmail>{account.email}</AccountEmail>
                    {!isActive && <LastActive>{Messages.lastActive(formatTimeAgo(account.lastActive))}</LastActive>}
                  </AccountInfo>
                  {isActive ? (
                    <ActiveBadge>ACTIVE</ActiveBadge>
                  ) : (
                    <IconButton
                      onClick={() => handleRemoveClick(account)}
                      disabled={isRemoving}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </AccountListItem>
              );
            })}

            {accounts.length < maxAccounts && (
              <div
                css={css`
                  margin-top: 16px;
                  font-size: 14px;
                  color: ${colors.textDim};
                  text-align: center;
                `}
              >
                ℹ️ You can have up to {maxAccounts} accounts.
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <ConfirmationModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onSubmit={handleConfirmRemove}
        title={Messages.removeAccountTitle()}
        confirmText={Messages.remove()}
        fullWidth={false}
      >
        <div>
          {isRemovingActive && nextAccount ? (
            <p>{Messages.removeActiveAccountMessage(confirmRemove?.displayName || "", nextAccount.displayName)}</p>
          ) : (
            <p>{Messages.removeAccountMessage(confirmRemove?.displayName || "")}</p>
          )}
        </div>
      </ConfirmationModal>
    </>
  );
};
