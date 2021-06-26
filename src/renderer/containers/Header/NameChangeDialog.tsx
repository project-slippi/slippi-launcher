/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import CircularProgress from "@material-ui/core/CircularProgress";
import TextField from "@material-ui/core/TextField";
import React from "react";
import { useToasts } from "react-toast-notifications";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useAccount } from "@/lib/hooks/useAccount";
import { useAsync } from "@/lib/hooks/useAsync";
import { changeDisplayName } from "@/lib/slippiBackend";

export const NameChangeDialog: React.FC<{
  displayName: string;
  open: boolean;
  handleClose: () => void;
}> = ({ displayName, open, handleClose }) => {
  const [name, setName] = React.useState(displayName);
  const setDisplayName = useAccount((store) => store.setDisplayName);
  const { addToast } = useToasts();

  const submitNameChange = useAsync(async () => {
    try {
      await changeDisplayName(name);
      setDisplayName(name);
    } catch (err) {
      console.error(err);
      addToast(err.message, { appearance: "error" });
    } finally {
      handleClose();
    }
  });

  return (
    <div>
      <ConfirmationModal
        title="Change display name"
        open={open}
        onClose={handleClose}
        closeOnSubmit={false}
        onSubmit={() => void submitNameChange.execute()}
        confirmProps={{
          disabled: submitNameChange.loading,
        }}
        confirmText={
          submitNameChange.loading ? (
            <span
              css={css`
                display: flex;
                align-items: center;
              `}
            >
              Loading
              <CircularProgress
                size={16}
                color="inherit"
                css={css`
                  margin-left: 10px;
                `}
              />
            </span>
          ) : (
            "Confirm"
          )
        }
      >
        <TextField
          required={true}
          autoFocus={true}
          value={name}
          label="Display name"
          inputProps={{
            maxLength: 15,
          }}
          onChange={(event) => setName(event.target.value)}
        />
      </ConfirmationModal>
    </div>
  );
};
