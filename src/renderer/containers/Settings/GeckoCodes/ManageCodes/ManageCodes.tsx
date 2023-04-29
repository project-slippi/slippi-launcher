import { css } from "@emotion/react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoIcon from "@mui/icons-material/Info";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { ConfirmationModal } from "@/components/ConfirmationModal";

export type GeckoCode = {
  name: string;
  enabled: boolean;
  userDefined: boolean;
  notes: string[];
};

export const ManageCodes = <T extends GeckoCode>({
  geckoCodes,
  handleToggle,
  handleCopy,
  handleDelete,
  onSave,
}: {
  geckoCodes: T[];
  handleToggle: (code: T) => void;
  handleCopy: (code: T) => void;
  handleDelete: (code: T) => void;
  onSave: () => void;
}) => {
  const [codeToDelete, setCodeToDelete] = React.useState<T | undefined>();

  return (
    <>
      <div
        css={css`
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        `}
      >
        <div
          css={css`
            flex: 1;
          `}
        >
          <List dense={true}>
            {geckoCodes.map((code, i) => (
              <GeckoCodeListItem
                key={i}
                name={code.name}
                enabled={code.enabled}
                canBeDeleted={code.userDefined}
                description={code.notes.join("\n")}
                onClick={() => handleToggle(code)}
                onCopy={() => handleCopy(code)}
                onDelete={() => setCodeToDelete(code)}
              />
            ))}
          </List>
        </div>
        <Button color="secondary" fullWidth={true} variant="contained" onClick={onSave}>
          Save
        </Button>
      </div>

      {codeToDelete && (
        <ConfirmationModal
          title="Are you sure you want to delete this code?"
          confirmText="Delete"
          open={codeToDelete !== undefined}
          onClose={() => setCodeToDelete(undefined)}
          onSubmit={() => handleDelete(codeToDelete)}
          fullWidth={false}
        >
          The code &lt;{codeToDelete.name}&gt; will be deleted. This cannot be undone.
        </ConfirmationModal>
      )}
    </>
  );
};

const GeckoCodeListItem = React.memo(function GeckoCodeListItem({
  name,
  enabled,
  canBeDeleted,
  description,
  onClick,
  onCopy,
  onDelete,
}: {
  name: string;
  enabled: boolean;
  canBeDeleted?: boolean;
  description?: string;
  onClick: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <ListItem
      css={css`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <Checkbox checked={enabled} onChange={onClick} />
        <span
          css={css`
            margin-right: 10px;
          `}
        >
          {name}
        </span>
        {description && (
          <Tooltip title={description}>
            <InfoIcon fontSize="small" htmlColor="#ffffff66" />
          </Tooltip>
        )}
      </div>
      <div
        css={css`
          display: flex;
        `}
      >
        {canBeDeleted && (
          <Tooltip title="Delete Code">
            <IconButton onClick={onDelete}>
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Copy to Clipboard">
          <IconButton onClick={onCopy}>
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </div>
    </ListItem>
  );
});
