import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import type { OpenDialogOptions } from "electron";
import React from "react";

export interface PathInputProps {
  onSelect: (filePath: string) => void;
  placeholder?: string;
  value?: string;
  options?: OpenDialogOptions;
  endAdornment?: JSX.Element;
  disabled?: boolean;
  tooltipText?: string;
}

export const PathInput = React.forwardRef<HTMLInputElement, PathInputProps>((props, ref) => {
  const { value, placeholder, endAdornment, onSelect, options, disabled, tooltipText } = props;
  const onClick = async () => {
    const result = await window.electron.common.showOpenDialog({ properties: ["openFile"], ...options });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
    onSelect(res[0]);
  };
  return (
    <Outer>
      <InputContainer>
        <CustomInput inputRef={ref} disabled={true} value={value} placeholder={placeholder} />
        {endAdornment}
      </InputContainer>
      <Tooltip title={tooltipText ?? ""}>
        <span>
          <Button color="secondary" variant="contained" onClick={onClick} disabled={disabled}>
            Select
          </Button>
        </span>
      </Tooltip>
    </Outer>
  );
});

const InputContainer = styled(Paper)`
  padding: 2px;
  display: flex;
  align-items: center;
  width: 400;
  flex: 1;
  margin-right: 10px;
`;

const CustomInput = styled(InputBase)`
  margin-left: 16px;
  margin-right: 16px;
  flex: 1;
  font-size: 14px;
`;
const Outer = styled.div`
  display: flex;
`;
