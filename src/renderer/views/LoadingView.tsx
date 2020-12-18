import { LoadingIndicator } from "@/components/LoadingIndicator";
import { colors } from "common/colors";
import React from "react";
import styled from "styled-components";
import { useApp } from "@/store/app";

const Outer = styled.div<{
  backgroundColor: string;
}>`
  height: 100%;
  width: 100%;
  background-color: ${(props) => props.backgroundColor};
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const LoadingView: React.FC = () => {
  const installStatus = useApp((store) => store.logMessage);
  return (
    <Outer backgroundColor={colors.offGray}>
      <LoadingIndicator />
      <div>{installStatus ? installStatus : "Just a sec..."}</div>
    </Outer>
  );
};
