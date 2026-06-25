import { IsoValidity } from "@common/types";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { ConfirmationModal } from "@/components/confirmation_modal/confirmation_modal";
import { useIsoPath } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";
import { cssVar } from "@/styles/css_variables";
import { hasBorder } from "@/styles/has_border";

import { QuickStartHeader } from "../../step_container";
import { IsoSelectionStepMessages as Messages } from "./iso_selection_step.messages";

const getColor = (props: any, defaultColor = "#eeeeee") => {
  if (props.isDragAccept) {
    return "#00e676";
  }
  if (props.isDragActive) {
    return cssVar("greenPrimary");
  }
  return defaultColor;
};

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  ${(props) =>
    hasBorder({
      width: 25,
      color: getColor(props),
      radius: 25,
      dashOffset: 50,
    })}
  color: var(--off-white);
  outline: none;
  transition: border 0.24s ease-in-out;
  p {
    text-align: center;
    font-weight: 500;
  }
`;

export const IsoSelectionStep = () => {
  const { showError } = useToasts();
  const [tempIsoPath, setTempIsoPath] = React.useState("");
  const validIsoPathQuery = useQuery({
    queryKey: ["validIsoPathQuery", tempIsoPath],
    queryFn: async () => {
      if (!tempIsoPath) {
        return {
          path: tempIsoPath,
          valid: IsoValidity.UNVALIDATED,
        };
      }
      return window.electron.common.checkValidIso(tempIsoPath);
    },
    enabled: Boolean(tempIsoPath),
  });

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const loading = validIsoPathQuery.isLoading;
  const [, setIsoPath] = useIsoPath();
  const nativeFilesRef = React.useRef<File[] | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (loading || acceptedFiles.length === 0) {
      return;
    }

    // Use the validated file from react-dropzone
    const accepted = acceptedFiles[0];

    // Find corresponding native-backed file
    const isoFile = nativeFilesRef.current?.find(
      (f) => f.name === accepted.name && f.size === accepted.size && f.lastModified === accepted.lastModified,
    );

    if (!isoFile) {
      return;
    }

    const filePath = window.electron.utils.getFilePath(isoFile);
    if (filePath.endsWith(".7z")) {
      showError(Messages.sevenZFilesMustBeUncompressed());
      return;
    } else if (filePath.endsWith(".rvz")) {
      showError(Messages.rvzFilesAreIncompatible());
      return;
    }

    setTempIsoPath(filePath);
  };

  const validIsoPath = validIsoPathQuery.data?.valid ?? IsoValidity.UNVALIDATED;

  const { open, getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    accept: {
      "application/octet-stream": [".iso", ".gcm", ".gcz", ".ciso", ".rvz"],
      "application/x-7z-compressed": [".7z"],
    },
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const invalidIso = Boolean(tempIsoPath) && !loading && validIsoPath === IsoValidity.INVALID;
  const unknownIso = Boolean(tempIsoPath) && !loading && validIsoPath === IsoValidity.UNKNOWN;
  const handleClose = () => setTempIsoPath("");
  const onConfirm = useCallback(() => {
    setIsoPath(tempIsoPath).catch(showError);
  }, [showError, setIsoPath, tempIsoPath]);

  React.useEffect(() => {
    if (invalidIso) {
      showError(Messages.providedIsoWillNotWork());
    }
  }, [showError, invalidIso]);

  React.useEffect(() => {
    // Auto-confirm ISO if it's valid
    if (validIsoPath === IsoValidity.VALID) {
      onConfirm();
    }
  }, [onConfirm, validIsoPath]);

  return (
    <Box display="flex" flexDirection="column" flexGrow="1" maxWidth="800px" marginLeft="auto" marginRight="auto">
      <div
        css={css`
          margin-bottom: 20px;
        `}
      >
        <QuickStartHeader>{Messages.selectMeleeIso()}</QuickStartHeader>
        <div>{Messages.thisApplicationUsesNtsc()}</div>
      </div>
      <Container
        {...getRootProps({
          isDragActive,
          isDragAccept,
          isDragReject,
          onDropCapture: (e) => {
            // This is a hack to get the native file object from the drag event.
            // In newer Chromium/Electron versions, the drag data store can become protected
            // after the drop handling phase, so by the time onDrop fires, event.dataTransfer.files is empty.
            // The reliable fix is to intercept the native drop event before react-dropzone processes it.
            // We need to do this to get the full file path.
            nativeFilesRef.current = Array.from(e.dataTransfer?.files ?? []);
          },
        })}
      >
        <input {...getInputProps()} />
        {!loading && (
          <Button color="primary" variant="contained" onClick={open}>
            {Messages.select()}
          </Button>
        )}
        <p>{loading ? Messages.verifyingIso() : Messages.orDragAndDropHere()}</p>
      </Container>

      <ConfirmationModal
        fullWidth={fullScreen}
        open={unknownIso}
        onClose={handleClose}
        onSubmit={onConfirm}
        confirmText={Messages.useAnyway()}
        title={Messages.unknownIso()}
      >
        {Messages.isoIsUnsupported()}
      </ConfirmationModal>
    </Box>
  );
};
