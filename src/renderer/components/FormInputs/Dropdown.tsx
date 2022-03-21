import { colors } from "@common/colors";
import styled from "@emotion/styled";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuItem from "@mui/material/MenuItem";
import MatSelect from "@mui/material/Select";
import React from "react";

export interface DropdownProps {
  value: any;
  options: Array<{
    value: any;
    label: string;
  }>;
  onChange: (val: any) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange }) => {
  const handleChange = React.useCallback(
    (event: any) => {
      onChange(JSON.parse(event.target.value));
    },
    [onChange],
  );

  return (
    <Select
      variant="outlined"
      value={JSON.stringify(value)}
      onChange={handleChange}
      IconComponent={KeyboardArrowDownIcon}
    >
      {options.map(({ value, label }) => {
        return (
          <MenuItem key={`option-${label}`} value={JSON.stringify(value)}>
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
