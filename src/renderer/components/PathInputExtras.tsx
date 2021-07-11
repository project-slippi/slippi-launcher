import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import Add from "@material-ui/icons/Add";
import ErrorIcon from "@material-ui/icons/Error";
import DeleteOutline from "@material-ui/icons/DeleteOutline";
import { OpenDialogOptions } from "electron";
import React from "react";

import { SettingItem } from "./../containers/Settings/SettingItem";
import { PathInput } from "./PathInput";
import { useExtraSlpPaths } from "@/lib/hooks/useSettings";

export interface PathInputExtrasProps {
  placeholder?: string;
  value?: string;
  options?: OpenDialogOptions;
  endAdornment?: JSX.Element;
  disabled?: boolean;
}

export const PathInputExtras = React.forwardRef<HTMLInputElement, PathInputExtrasProps>((props) => {
  const { placeholder } = props;

  const [additionalDirs, setAdditionalDirs] = useExtraSlpPaths();

  const deleteRow = async (index: number) => {
    const dirs = additionalDirs.filter((_, idx) => index !== idx);
    setAdditionalDirs(dirs);
  };

  const addRow = async () => {
    setAdditionalDirs([...additionalDirs, ""]);
  };

  const setAdditionalDir = async (filePath: string, index: number) => {
    const dirs = [...additionalDirs];
    dirs[index] = filePath;
    setAdditionalDirs(dirs);
  };

  const Row = additionalDirs.map((dir, index) => {
    return (
      <InputRowDiv key={index}>
        <PathInput
          value={dir}
          onSelect={(filePath) => setAdditionalDir(filePath, index)}
          placeholder={placeholder}
          options={{
            properties: ["openDirectory"],
          }}
          endAdornment={
            <Button
              onClick={() => deleteRow(index)}
              style={{
                color: "grey",
              }}
            >
              <DeleteOutline />
            </Button>
          }
        />
      </InputRowDiv>
    );
  });

  return (
    <Outer>
      <SettingItem name="Additional SLP Directories" description="Additional folders where SLP replays are stored.">
        <AddAdditional>
          {...Row}
          <Button
            disabled={
              additionalDirs[additionalDirs.length - 1] === "" ||
              additionalDirs.slice(0, -1).includes(additionalDirs[additionalDirs.length - 1])
            }
            style={{
              minWidth: "25px",
            }}
            onClick={addRow}
          >
            {additionalDirs.slice(0, -1).includes(additionalDirs[additionalDirs.length - 1]) ? (
              <div>
                <ErrorIcon style={{ color: "#FF5555" }} />
                Duplicate directory
              </div>
            ) : (
              <Add />
            )}
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
  border: 0px dashed yellow;
  margin-top: 6px;
  margin-bottom: 6px;
`;

const AddAdditional = styled.div`
  border: 0px dashed purple;
  align-items: center;
  margin: 5px;
  margin-right: auto;
`;
