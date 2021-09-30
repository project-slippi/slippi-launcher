/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import MatCheckbox, { CheckboxProps as MatCheckboxProps } from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Tooltip from "@material-ui/core/Tooltip";

export interface CheckboxProps extends MatCheckboxProps {
  label: React.ReactNode;
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
            <MatCheckbox size="small" disabled={disabled} {...rest} />
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
