/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import MatCheckbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, className }) => (
  <FormControlLabel
    className={className}
    control={<MatCheckbox size="small" checked={checked} onChange={onChange} />}
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
