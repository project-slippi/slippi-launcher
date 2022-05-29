import { css } from "@emotion/react";
import type { CheckboxProps as MatCheckboxProps } from "@mui/material/Checkbox";
import MatCheckbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";

export interface CheckboxProps extends MatCheckboxProps {
  label: any;
  className?: string;
  hoverText?: string;
}

export const Checkbox: React.FC<CheckboxProps> = (props) => {
  const { label, className, disabled, hoverText, ...rest } = props;
  return (
    <FormControlLabel
      className={className}
      control={
        <Tooltip title={hoverText ?? ""} style={{ cursor: disabled ? "initial" : "pointer" }}>
          <div>
            <MatCheckbox size="small" disabled={disabled} {...rest} color="secondary" />
          </div>
        </Tooltip>
      }
      label={label}
      css={css`
        margin: 0;
        .MuiCheckbox-root {
          padding: 0;
          padding-right: 5px;
        }
      `}
    />
  );
};
