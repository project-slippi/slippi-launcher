import styled from "@emotion/styled";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import { OpenDialogOptions, remote } from "electron";
import React from "react";
import { Checkbox } from "./FormInputs/Checkbox";
import { useState } from "react";
import { useToasts } from "react-toast-notifications";

export interface PathInputMultipleProps {
  updatePaths: (paths: string[]) => void;
  placeholder?: string;
  paths: string[];
  options?: OpenDialogOptions;
  endAdornment?: JSX.Element;
  disabled?: boolean;
}

export const PathInputMultiple = React.forwardRef<HTMLInputElement, PathInputMultipleProps>((props) => {
  const { paths, updatePaths, options } = props;
  const { addToast } = useToasts();

  const onAddClick = async () => {
    const result = await remote.dialog.showOpenDialog({ properties: ["openFile"], ...options });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }

    if (paths.indexOf(res[0]) !== -1) {
      addToast("That directory is already included", {
        appearance: "info",
        autoDismiss: true,
        autoDismissTimeout: 3000,
      });
      return;
    }

    updateCheckboxSelections((arr) => {
      return [...arr, false];
    });

    updatePaths([...paths, res[0]]);
  };

  const onRemoveClick = async () => {
    const filteredList = paths.filter((_path, index) => {
      return !checkboxSelections[index];
    });

    updateCheckboxSelections(() => {
      return Array(paths?.length).fill(false);
    });

    updatePaths(filteredList);
  };

  const [checkboxSelections, updateCheckboxSelections] = useState(Array(paths?.length).fill(false));

  const onToggle = (index: number) => {
    updateCheckboxSelections((arr) => {
      const newArr = arr;
      newArr[index] = !newArr[index];
      return [...newArr];
    });
  };

  const Rows = paths?.map((path, index) => {
    return (
      <MultiRowEntry key={index}>
        <MultiRowInput value={path} disabled={true} endAdornment={null} />
        <Check>
          <Checkbox label={""} checked={checkboxSelections[index]} onChange={() => onToggle(index)} />
        </Check>
      </MultiRowEntry>
    );
  });

  return (
    <Outer>
      {Rows.length > 0 ? <InputContainer>{Rows}</InputContainer> : ""}
      <ButtonGroup>
        <Button color="secondary" variant="contained" onClick={onAddClick} style={{ margin: "2.5px", padding: "0px" }}>
          Add
        </Button>
        {Rows.length > 0 ? (
          <Button
            color="secondary"
            variant="contained"
            onClick={onRemoveClick}
            disabled={checkboxSelections.indexOf(true) === -1}
            style={{ margin: "2.5px", padding: "0px", paddingLeft: "10px", paddingRight: "10px" }}
          >
            Remove
          </Button>
        ) : (
          ""
        )}
      </ButtonGroup>
    </Outer>
  );
});

const Outer = styled.div`
  display: block;
`;

const InputContainer = styled(Paper)`
  padding: 2px;
  display: flex;
  align-items: center;
  width: 400;
  flex: 1;
  margin-right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  border: 0px dashed yellow;
  display: block;
`;

const MultiRowEntry = styled.div`
  border: 0px dashed purple;
  display: block;
`;

const MultiRowInput = styled(InputBase)`
  margin-left: 16px;
  margin-right: 16px;
  flex: 1;
  width: 70%;
  font-weight: 300;
  font-size: 14px;
  border: 0px dashed green;
  padding-top: 6px;
`;

const Check = styled.div`
  border: 0px solid yellow;
  float: right;
  border-radius: 25%;
  padding: 5px;
`;

const ButtonGroup = styled.div`
  float: right;
  padding: 5px;
`;
