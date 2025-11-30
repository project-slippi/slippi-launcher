import styled from "@emotion/styled";
import Box from "@mui/material/Box";
import React from "react";

export const QuickStartHeader = styled.h2`
  font-weight: normal;
  margin: 0;
  margin-bottom: 15px;
`;

const Container = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
`;

type StepContainerProps = {
  header?: string;
  children: React.ReactNode;
};

export const StepContainer = ({ header, children }: StepContainerProps) => {
  return (
    <Box display="flex" flexDirection="column" flexGrow="1">
      <Container>
        {header && <QuickStartHeader>{header}</QuickStartHeader>}
        {children}
      </Container>
    </Box>
  );
};
