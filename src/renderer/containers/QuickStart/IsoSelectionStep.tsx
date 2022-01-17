/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { colors } from "common/colors";
import { ipc_checkValidIso } from "common/ipc";
import { IsoValidity } from "common/types";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useToasts } from "react-toast-notifications";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useIsoPath } from "@/lib/hooks/useSettings";
import { hasBorder } from "@/styles/hasBorder";

import { QuickStartHeader } from "./QuickStartHeader";

const getColor = (props: any, defaultColor = "#eeeeee") => {
  if (props.isDragAccept) {
    return "#00e676";
  }
  if (props.isDragActive) {
    return colors.greenPrimary;
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
  color: white;
  outline: none;
  transition: border 0.24s ease-in-out;
  p {
    text-align: center;
    font-weight: 500;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 10px;
  color: ${({ theme }) => theme.palette.error.main};
  font-size: 16px;
`;

export const IsoSelectionStep: React.FC = () => {
  const [tempIsoPath, setTempIsoPath] = React.useState("");
  const verification = ipc_checkValidIso.renderer!.useValue(
    { path: tempIsoPath },
    { path: tempIsoPath, valid: IsoValidity.INVALID },
  );
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const loading = verification.isUpdating;
  const [, setIsoPath] = useIsoPath();

  const onDrop = (acceptedFiles: File[]) => {
    if (loading || acceptedFiles.length === 0) {
      return;
    }

    const filePath = acceptedFiles[0].path;
    setTempIsoPath(filePath);
  };
  const validIsoPath = verification.value.valid;

  const { open, getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    accept: [".iso", ".gcm", ".gcz"],
    onDrop: onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const invalidIso = Boolean(tempIsoPath) && !loading && validIsoPath === IsoValidity.INVALID;
  const unknownIso = Boolean(tempIsoPath) && !loading && validIsoPath === IsoValidity.UNKNOWN;
  const handleClose = () => setTempIsoPath("");
  const { addToast } = useToasts();
  const onConfirm = useCallback(() => {
    setIsoPath(tempIsoPath).catch((err) => addToast(err.message, { appearance: "error" }));
  }, [addToast, setIsoPath, tempIsoPath]);

  React.useEffect(() => {
    // Auto-confirm ISO if it's valid
    if (verification.value.valid === IsoValidity.VALID) {
      onConfirm();
    }
  }, [onConfirm, verification.value.valid]);

  return (
    <Box display="flex" flexDirection="column" flexGrow="1" maxWidth="800px" marginLeft="auto" marginRight="auto">
      <div
        css={css`
          margin-bottom: 20px;
        `}
      >
        <QuickStartHeader>Select Melee ISO</QuickStartHeader>
        <div>This application uses an NTSC 1.02 game backup.</div>
      </div>
      <Container {...getRootProps({ isDragActive, isDragAccept, isDragReject })}>
        <input {...getInputProps()} />
        {!loading && (
          <Button color="primary" variant="contained" onClick={open}>
            Select
          </Button>
        )}
        <p>{loading ? "Verifying ISO..." : "or drag and drop here"}</p>
        {invalidIso && (
          <ErrorMessage>Provided ISO will not work with Slippi Online. Please provide an NTSC 1.02 ISO.</ErrorMessage>
        )}
      </Container>

      <ConfirmationModal
        fullWidth={fullScreen}
        open={unknownIso}
        onClose={handleClose}
        onSubmit={onConfirm}
        confirmText="Use anyway"
        title="Unknown ISO"
      >
        Your ISO is unsupported. Using this ISO may cause issues and no support will be given.
      </ConfirmationModal>
    </Box>
  );
};
