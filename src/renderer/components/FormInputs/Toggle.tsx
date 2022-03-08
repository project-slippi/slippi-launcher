import { css } from "@emotion/react";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import React from "react";

export interface ToggleProps {
  label: string;
  description: string | React.ReactNode;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ label, description, value, onChange, disabled }) => {
  return (
    <div>
      <FormControlLabel
        labelPlacement="start"
        control={
          <Switch checked={value} onChange={(e) => onChange(e.target.checked)} color="primary" disabled={disabled} />
        }
        label={label}
        css={css`
          margin-left: 0;
          margin-right: 0;
          justify-content: space-between;
          width: 100%;
          margin-bottom: -5px;
        `}
      />
      <Typography variant="caption">{description}</Typography>
    </div>
  );
};
