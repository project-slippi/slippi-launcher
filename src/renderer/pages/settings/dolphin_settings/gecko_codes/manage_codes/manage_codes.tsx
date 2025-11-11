import { css } from "@emotion/react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoIcon from "@mui/icons-material/Info";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

import { ConfirmationModal } from "@/components/confirmation_modal";

import { ManageCodesMessages as Messages } from "./manage_codes.messages";

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
}: {
  geckoCodes: T[];
  handleToggle: (code: T) => void;
  handleCopy: (code: T) => void;
  handleDelete: (code: T) => void;
}) => {
  const [codeToDelete, setCodeToDelete] = React.useState<T | undefined>();

  return (
    <>
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

      {codeToDelete && (
        <ConfirmationModal
          title={Messages.areYouSure()}
          confirmText={Messages.delete()}
          open={codeToDelete !== undefined}
          onClose={() => setCodeToDelete(undefined)}
          onSubmit={() => handleDelete(codeToDelete)}
          fullWidth={false}
        >
          {Messages.codeWillBeDeleted(codeToDelete.name)}
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
        border-radius: 5px;
        transition: background-color 0.1s linear;
        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
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
          <Tooltip title={Messages.deleteCode()}>
            <IconButton onClick={onDelete}>
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={Messages.copyToClipboard()}>
          <IconButton onClick={onCopy}>
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </div>
    </ListItem>
  );
});
