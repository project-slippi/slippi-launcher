import styled from "@emotion/styled";
import MenuItem from "@material-ui/core/MenuItem";
import { default as MatSelect } from "@material-ui/core/Select";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import { colors } from "common/colors";
import React from "react";

export interface DropdownProps {
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange: (val: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange }) => {
  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onChange(event.target.value as string);
  };
  return (
    <Select variant="outlined" value={value} onChange={handleChange} IconComponent={KeyboardArrowDownIcon}>
      {options.map(({ value, label }) => {
        return (
          <MenuItem key={`option-${value}`} value={value}>
            {label}
          </MenuItem>
        );
      })}
    </Select>
  );
};

const Select = styled(MatSelect)`
  .MuiOutlinedInput-notchedOutline {
    border-width: 2px;
    border-radius: 10px;
    border-color: ${colors.purpleDark};
  }
  .MuiSelect-outlined {
    padding: 8px;
    padding-left: 15px;
    padding-right: 50px;
    font-size: 12px;
  }
  .MuiSelect-icon {
    color: ${colors.purpleLight};
    top: 50%;
    transform: translateY(-50%);
  }
`;
