import { css } from "@emotion/react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { StoredConnection } from "@settings/types";
import { Ports } from "@slippi/slippi-js";
import merge from "lodash/merge";
import React from "react";

import { useSettings } from "@/lib/hooks/useSettings";

import { AddConnectionForm } from "./AddConnectionForm";

export interface AddConnectionDialogProps {
  open: boolean;
  selectedConnection: Partial<StoredConnection> | null;
  onSubmit: (conn: Omit<StoredConnection, "id">) => void;
  onCancel: () => void;
  disabled: boolean;
}

export const AddConnectionDialog: React.FC<AddConnectionDialogProps> = ({
  open,
  selectedConnection,
  onSubmit,
  onCancel,
  disabled,
}) => {
  const spectateFolder = useSettings((store) => store.settings.spectateSlpPath);
  const isEditing = Boolean(selectedConnection && selectedConnection.id);
  const [title, setTitle] = React.useState("");
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const updateTitle = () => {
    setTitle(isEditing ? "Edit Connection" : "New Connection");
  };
  const defaultValues: Partial<StoredConnection> = merge(
    {
      isRealtime: false,
      folderPath: spectateFolder,
      port: Ports.DEFAULT,
      enableRelay: false,
      enableAutoSwitcher: false,
      useNicknameFolders: true,
      obsPort: 4455,
    },
    selectedConnection,
  );
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth={true}
      fullScreen={fullScreen}
      closeAfterTransition={true}
      TransitionProps={{
        onEntering: updateTitle,
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <div
          css={css`
            padding-bottom: 20px;
          `}
        >
          <AddConnectionForm defaultValues={defaultValues} onSubmit={onSubmit} disabled={disabled} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
