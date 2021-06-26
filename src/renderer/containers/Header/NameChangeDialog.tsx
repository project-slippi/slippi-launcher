import TextField from "@material-ui/core/TextField";
import React from "react";

import { ConfirmationModal } from "@/components/ConfirmationModal";

export const NameChangeDialog: React.FC<{
  displayName: string;
  open: boolean;
  onSubmit: (name: string) => Promise<void>;
  handleClose: () => void;
}> = ({ displayName, open, onSubmit, handleClose }) => {
  const [name, setName] = React.useState(displayName);
  const onSubmitHandler = async () => {
    await onSubmit(name);
  };
  return (
    <div>
      <ConfirmationModal title="Change display name" open={open} onClose={handleClose} onSubmit={onSubmitHandler}>
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
