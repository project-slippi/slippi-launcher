import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { colors } from "common/colors";
import React from "react";
import { useDropzone } from "react-dropzone";
import styled from "styled-components";

import { useSettings } from "@/store/settings";
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

const ErrorMessage = styled.div`
  color: red;
  font-weight: bold;
  margin-bottom: 20px;
`;

export const IsoSelectionStep: React.FC = () => {
  const loading = useSettings((store) => store.verifyingIso);
  const isoPath = useSettings((store) => store.settings.isoPath);
  const validIsoPath = useSettings((store) => store.validIsoPath);
  const setIsoPath = useSettings((store) => store.setIsoPath);
  const verifyIsoPath = useSettings((store) => store.verifyIsoPath);
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (loading || acceptedFiles.length === 0) {
      // Only verify one file at a time
      return;
    }

    const filePath = acceptedFiles[0].path;
    setIsoPath(filePath);
    verifyIsoPath(filePath);
  }, []);

  const {
    open,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: ".iso",
    onDrop: onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <QuickStartHeader>Select Melee ISO</QuickStartHeader>
      <Container
        {...getRootProps({ isDragActive, isDragAccept, isDragReject })}
      >
        <input {...getInputProps()} />
        {isoPath && !loading && !validIsoPath && (
          <ErrorMessage>Invalid ISO</ErrorMessage>
        )}
        {!loading && (
          <Button
            color="primary"
            variant="contained"
            onClick={open}
            style={{ textTransform: "none" }}
          >
            Select
          </Button>
        )}
        <p>{loading ? "Verifying ISO..." : "Or drag and drop here"}</p>
      </Container>
    </Box>
  );
};
