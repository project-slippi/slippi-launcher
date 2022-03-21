import { css } from "@emotion/react";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import type { MenuProps } from "@mui/material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";

export interface IconMenuItem {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

export interface IconMenuProps extends MenuProps {
  items: IconMenuItem[];
}

export const IconMenu: React.FC<IconMenuProps> = (props) => {
  const { items, ...rest } = props;
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
        </MenuItem>
      ))}
    </Menu>
  );
};
