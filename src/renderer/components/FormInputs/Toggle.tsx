/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import React from "react";

export interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, value, onChange }) => {
  return (
    <FormControlLabel
      labelPlacement="start"
      control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} color="primary" />}
      label={label}
      css={css`
        margin-left: 0;
        margin-right: 0;
        justify-content: space-between;
        width: 100%;
      `}
    />
  );
};
