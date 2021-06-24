/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { StoredConnection } from "@settings/types";
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
}

export const AddConnectionDialog: React.FC<AddConnectionDialogProps> = ({
  open,
  selectedConnection,
  onSubmit,
  onCancel,
}) => {
  const spectateFolder = useSettings((store) => store.settings.spectateSlpPath);
  const isEditing = Boolean(selectedConnection && selectedConnection.id);
  const [title, setTitle] = React.useState("");
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const updateTitle = () => {
    setTitle(isEditing ? "Edit Connection" : "New Connection");
  };
  const defaultValues: Partial<StoredConnection> = merge(
    { isRealTimeMode: false, folderPath: spectateFolder, port: Ports.DEFAULT },
    selectedConnection,
  );
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth={true}
      fullScreen={fullScreen}
      closeAfterTransition={true}
      onEntering={updateTitle}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <div
          css={css`
            padding-bottom: 20px;
          `}
        >
          <AddConnectionForm defaultValues={defaultValues} onSubmit={onSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
