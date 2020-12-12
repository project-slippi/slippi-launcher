import { LoadingIndicator } from "@/components/LoadingIndicator";
import React from "react";
import styled from "styled-components";

const Outer = styled.div`
  height: 100%;
  width: 100%;
  background-color: green;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const LoadingView: React.FC = () => {
  return (
    <Outer>
      <LoadingIndicator />
      <div>Loading...</div>
    </Outer>
  );
};
