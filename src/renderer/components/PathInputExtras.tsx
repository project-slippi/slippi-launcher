import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import { OpenDialogOptions, remote } from "electron";
import Add from "@material-ui/icons/Add";
import React from "react";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import { SettingItem } from "./../containers/Settings/SettingItem";

export interface PathInputAdditionProps {
  paths: string[];
  placeholder?: string;
  value?: string;
  options?: OpenDialogOptions;
  endAdornment?: JSX.Element;
  disabled?: boolean;
}

export const PathInputAddition = React.forwardRef<HTMLInputElement, PathInputAdditionProps>((props, ref) => {
  const { value, placeholder, options, disabled } = props;
  const onClick = async () => {
    const result = await remote.dialog.showOpenDialog({ properties: ["openFile"], ...options });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }
  };

  const deleteRow = async () => {
    console.log("deleting existing row");
  };

  const addRow = async () => {
    console.log("adding new row");
  };

  const [additionalDirs, setAdditionalDirs] = React.useState([""]);

  const Row = React.useCallback(
    (props: { style?: React.CSSProperties; index: number }) => {
      return (
        <InputRowDiv>
          <InputContainer>
            <CustomInput
              inputRef={ref}
              disabled={true}
              value={additionalDirs[index]}
              placeholder={placeholder}
              endAdornment={
                <Button
                  onClick={deleteRow}
                  style={{
                    color: "grey",
                  }}
                >
                  <DeleteOutline />
                </Button>
              }
            />
          </InputContainer>
          <Button color="secondary" variant="contained" onClick={onClick} disabled={disabled}>
            Select
          </Button>
        </InputRowDiv>
      );
    },
    [additionalDirs],
  );

  return (
    <Outer>
      <SettingItem name="Additional SLP Directories" description="Additional folders where SLP replays are stored.">
        <AddAdditional>
          <Button
            style={{
              minWidth: "25px",
            }}
            onClick={addRow}
          >
            {Row}
            <Add />
          </Button>
        </AddAdditional>
      </SettingItem>
    </Outer>
  );
});

const Outer = styled.div`
  border: 0px solid green;
  align-items: right;
`;

const InputRowDiv = styled.div`
  display: flex;
  margin-top: 6px;
  margin-bottom: 6px;
`;

const InputContainer = styled(Paper)`
  border: 0px solid red;
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
  font-weight: 300;
  font-size: 14px;
`;

const AddAdditional = styled.div`
  border: 0px solid purple;
  align-items: center;
  margin: 5px;
  margin-left: 1%;
  margin-right: auto;
`;
