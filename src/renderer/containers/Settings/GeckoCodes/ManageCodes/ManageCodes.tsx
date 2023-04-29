import { css } from "@emotion/react";
import { ContentCopy, DeleteForeverOutlined } from "@mui/icons-material";
import InfoIcon from "@mui/icons-material/Info";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

export type GeckoCode = {
  name: string;
  enabled: boolean;
  userDefined: boolean;
  notes: string[];
};

export const ManageCodes = ({
  geckoCodes,
  handleToggle,
  handleCopy,
  handleDelete,
  onSave,
}: {
  geckoCodes: GeckoCode[];
  handleToggle: (code: GeckoCode) => void;
  handleCopy: (code: GeckoCode) => void;
  handleDelete: (code: GeckoCode) => void;
  onSave: () => void;
}) => {
  return (
    <Box textAlign="center">
      {geckoCodes.map((code, i) => (
        <GeckoCodeListItem
          key={i}
          name={code.name}
          enabled={code.enabled}
          userDefined={code.userDefined}
          tooltip={code.notes.join("\n")}
          onClick={() => handleToggle(code)}
          onCopy={() => handleCopy(code)}
          onDelete={() => handleDelete(code)}
        />
      ))}
      <Button color="secondary" fullWidth={true} variant="contained" onClick={onSave}>
        Save
      </Button>
    </Box>
  );
};

const GeckoCodeListItem = React.memo(function GeckoCodeListItem({
  name,
  enabled,
  userDefined,
  tooltip,
  onClick,
  onCopy,
  onDelete,
}: {
  name: string;
  enabled: boolean;
  userDefined?: boolean;
  tooltip?: string;
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
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoIcon htmlColor="#ffffff66" />
          </Tooltip>
        )}
      </div>
      <div>
        {userDefined && (
          <Tooltip title="Delete Code">
            <IconButton onClick={onDelete}>
              <DeleteForeverOutlined />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Copy to Clipboard">
          <IconButton onClick={onCopy}>
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </div>
    </ListItem>
  );
});
