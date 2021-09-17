import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import { OpenDialogOptions, remote } from "electron";
import React from "react";

export interface PathInputProps {
  onSelect: (filePath: string) => void;
  placeholder?: string;
  value?: string;
  options?: OpenDialogOptions;
  endAdornment?: JSX.Element;
  disabled?: boolean;
}

export const PathInput = React.forwardRef<HTMLInputElement, PathInputProps>((props, ref) => {
  const { value, placeholder, endAdornment, onSelect, options, disabled } = props;
  const onClick = async () => {
    const result = await remote.dialog.showOpenDialog({ properties: ["openFile"], ...options });
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
      <Tooltip title={disabled ? "Can't change this setting while Dolphin is open." : ""}>
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
  background-color: rgba(0, 0, 0, 0.7);
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
