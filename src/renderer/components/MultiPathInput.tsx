/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import Button from "@material-ui/core/Button";
import MatCheckbox from "@material-ui/core/Checkbox";
import InputBase from "@material-ui/core/InputBase";
import type { OpenDialogOptions } from "electron";
import React, { useState } from "react";
import { useToasts } from "react-toast-notifications";

import { useSettings } from "@/lib/hooks/useSettings";

export interface MultiPathInputProps {
  updatePaths: (paths: string[]) => void;
  paths: string[];
  options?: OpenDialogOptions;
}

export const MultiPathInput: React.FC<MultiPathInputProps> = ({ paths, updatePaths, options }) => {
  const { addToast } = useToasts();
  const rootFolder = useSettings((store) => store.settings.rootSlpPath);

  const assertValidPath = (newPath: string): boolean => {
    const addErrorToast = (description: string) => {
      addToast(description, {
        appearance: "error",
        autoDismiss: true,
        autoDismissTimeout: 5000,
      });
    };
    if (paths.includes(newPath)) {
      addErrorToast("That directory is already included.");
      return false;
    }

    if (newPath.includes(rootFolder)) {
      addErrorToast("Cannot add sub directories of the Root SLP Directory.");
      return false;
    }

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (newPath.includes(path)) {
        addErrorToast("Cannot add sub directories of the Root SLP Directory.");
        return false;
      } else if (path.includes(newPath)) {
        updatePaths(paths.splice(i, 1));
        paths = paths.splice(i--, 1); //decrement i because we are dropping an entry
      }
    }
    return true;
  };

  const onAddClick = async () => {
    const result = await window.electron.dialog.showOpenDialog({ properties: ["openFile"], ...options });
    const res = result.filePaths;
    if (result.canceled || res.length === 0) {
      return;
    }

    const newPath = res[0];
    const isValidPath = assertValidPath(newPath);
    if (!isValidPath) {
      return;
    }

    updateCheckboxSelections((arr) => {
      return [...arr, false];
    });

    updatePaths([...paths, newPath]);
  };

  const onRemoveClick = async () => {
    const filteredList = paths.filter((_path, index) => {
      return !checkboxSelections[index];
    });

    updateCheckboxSelections(() => {
      return Array(paths.length).fill(false);
    });

    updatePaths(filteredList);
  };

  const [checkboxSelections, updateCheckboxSelections] = useState(Array(paths.length).fill(false));

  const onToggle = (index: number) => {
    updateCheckboxSelections((arr) => {
      const newArr = arr;
      newArr[index] = !newArr[index];
      return [...newArr];
    });
  };

  const Rows = paths.map((path, index) => {
    return (
      <div key={index}>
        <InputBase
          css={css`
            width: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            border-radius: 10px;
            font-size: 14px;
            margin-bottom: 5px;
            padding-right: 10px;
          `}
          value={path}
          disabled={true}
          startAdornment={
            <MatCheckbox checked={checkboxSelections[index]} onChange={() => onToggle(index)} size="small" />
          }
        />
      </div>
    );
  });

  return (
    <div>
      {Rows.length > 0 ? (
        <div>{Rows}</div>
      ) : (
        <div
          css={css`
            font-size: 14px;
            font-style: italic;
            opacity: 0.7;
          `}
        >
          No additional directories added.
        </div>
      )}
      <div
        css={css`
          margin-top: 10px;
        `}
      >
        <Button color="secondary" variant="contained" onClick={onAddClick}>
          Add
        </Button>
        <Button
          color="secondary"
          variant="outlined"
          onClick={onRemoveClick}
          disabled={checkboxSelections.indexOf(true) === -1}
          css={css`
            margin-left: 10px;
          `}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};
