import styled from "@emotion/styled";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { colors } from "common/colors";
import { checkValidIso } from "common/ipc";
import React from "react";
import { useDropzone } from "react-dropzone";

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
    text-transform: uppercase;
    font-weight: bold;
  }
`;

export const IsoSelectionStep: React.FC = () => {
  const [tempIsoPath, setTempIsoPath] = React.useState("");
  const verification = checkValidIso.renderer!.useValue({ path: tempIsoPath }, { path: tempIsoPath, valid: false });
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
    accept: ".iso",
    onDrop: onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });
  const invalidIso = Boolean(tempIsoPath) && !loading && !validIsoPath;
  const handleClose = () => setTempIsoPath("");
  const onConfirm = () => setIsoPath(tempIsoPath);

  React.useEffect(() => {
    // Auto-confirm ISO if it's valid
    if (verification.value.valid) {
      onConfirm();
    }
  }, [verification.value.valid]);

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <QuickStartHeader>Select Melee ISO</QuickStartHeader>
      <Container {...getRootProps({ isDragActive, isDragAccept, isDragReject })}>
        <input {...getInputProps()} />
        {!loading && (
          <Button color="primary" variant="contained" onClick={open} style={{ textTransform: "none" }}>
            Select
          </Button>
        )}
        <p>{loading ? "Verifying ISO..." : "Or drag and drop here"}</p>
      </Container>
      <Dialog fullScreen={fullScreen} open={invalidIso} onClose={handleClose}>
        <DialogTitle>Invalid ISO</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your ISO is unsupported. Using this ISO will likely cause issues and no support will be given.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={onConfirm} color="primary">
            Use anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
