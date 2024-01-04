import { css } from "@emotion/react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import type { MenuProps } from "@mui/material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";

export type IconMenuItem = {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  external?: boolean;
};

type IconMenuProps = MenuProps & {
  items: IconMenuItem[];
};

export const IconMenu = ({ items, ...rest }: IconMenuProps) => {
  return (
    <Menu {...rest}>
      {items.map((item) => (
        <MenuItem key={item.label} onClick={item.onClick} disabled={item.disabled}>
          <ListItemIcon
            css={css`
              margin-right: 10px;
            `}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.label} />
          {item.external && (
            <span
              css={css`
                display: flex;
                margin-left: 20px;
                opacity: 0.8;
              `}
            >
              <OpenInNewIcon fontSize="small" />
            </span>
          )}
        </MenuItem>
      ))}
    </Menu>
  );
};
