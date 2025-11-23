import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import type { OpenDialogOptions } from "electron";
import React, { useState } from "react";

import { Checkbox } from "@/components/form/checkbox";
import { useSettings } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";

import { MultiPathInputMessages as Messages } from "./multi_path_input.messages";

const { isSubdirectory } = window.electron.utils;

type MultiPathInputProps = {
  updatePaths: (paths: string[]) => void;
  paths: string[];
  options?: OpenDialogOptions;
};

export const MultiPathInput = ({ paths, updatePaths, options }: MultiPathInputProps) => {
  const { showError } = useToasts();
  const rootFolder = useSettings((store) => store.settings.rootSlpPath);

  const assertValidPath = (newPath: string): boolean => {
    const addErrorToast = (description: string) => {
      showError(description);
    };
    if (paths.includes(newPath)) {
      addErrorToast(Messages.thatDirectoryIsAlreadyIncluded());
      return false;
    }

    if (isSubdirectory(rootFolder, newPath)) {
      addErrorToast(Messages.cannotAddSubdirectoriesOfRoot());
      return false;
    }

    let pathsToCheck = paths;
    for (let i = 0; i < pathsToCheck.length; i++) {
      const path = pathsToCheck[i];
      if (isSubdirectory(path, newPath)) {
        addErrorToast(Messages.cannotAddSubdirectoriesOfRoot());
        return false;
      } else if (isSubdirectory(newPath, path)) {
        updatePaths(pathsToCheck.splice(i, 1));
        pathsToCheck = pathsToCheck.splice(i--, 1); //decrement i because we are dropping an entry
      }
    }
    return true;
  };

  const onAddClick = async () => {
    const result = await window.electron.common.showOpenDialog({ properties: ["openFile"], ...options });
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

  const onToggle = React.useCallback(
    (index: number) => {
      updateCheckboxSelections((arr) => {
        const newArr = [...arr];
        newArr[index] = !newArr[index];
        return newArr;
      });
    },
    [updateCheckboxSelections],
  );

  const pathRows = React.useMemo(
    () =>
      paths.map((path, index) => {
        return (
          <div
            key={index}
            css={css`
              width: 100%;
              border-radius: 10px;
              font-size: 14px;
              margin-bottom: 5px;
              padding-right: 10px;
            `}
          >
            <Checkbox
              label={<CheckboxDescription>{path}</CheckboxDescription>}
              checked={checkboxSelections[index]}
              onChange={() => onToggle(index)}
              size="small"
            />
          </div>
        );
      }),
    [paths, checkboxSelections, onToggle],
  );

  return (
    <div>
      {pathRows.length > 0 ? (
        <div>{pathRows}</div>
      ) : (
        <div
          css={css`
            font-size: 14px;
            font-style: italic;
            opacity: 0.7;
          `}
        >
          {Messages.noAdditionalDirectoriesAdded()}
        </div>
      )}
      <div
        css={css`
          margin-top: 10px;
        `}
      >
        <Button color="secondary" variant="contained" onClick={onAddClick}>
          {Messages.add()}
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
          {Messages.remove()}
        </Button>
      </div>
    </div>
  );
};

const CheckboxDescription = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.disabled};
`;
