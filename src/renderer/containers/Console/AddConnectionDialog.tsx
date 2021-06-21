import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { StoredConnection } from "@settings/types";
import merge from "lodash/merge";
import React from "react";

import { useSettings } from "@/lib/hooks/useSettings";

import { AddConnectionForm } from "./AddConnectionForm";

export interface AddConnectionModalProps {
  selectedConnection: Partial<StoredConnection> | null;
  onSubmit: (conn: Omit<StoredConnection, "id">) => void;
  onCancel: () => void;
}

export const AddConnectionDialog: React.FC<AddConnectionModalProps> = ({ selectedConnection, onSubmit, onCancel }) => {
  const spectateFolder = useSettings((store) => store.settings.spectateSlpPath);
  const isEditing = Boolean(selectedConnection && selectedConnection.id);
  const [title, setTitle] = React.useState("");
  const isOpen = selectedConnection !== null;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const updateTitle = () => {
    setTitle(isEditing ? "Edit Connection" : "New Connection");
  };
  const defaultValues: Partial<StoredConnection> = merge(
    { isRealTimeMode: false, folderPath: spectateFolder },
    selectedConnection,
  );
  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      fullWidth={true}
      fullScreen={fullScreen}
      closeAfterTransition={true}
      onEntering={updateTitle}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <AddConnectionForm defaultValues={defaultValues} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};
