import { LoadingIndicator } from "@/components/LoadingIndicator";
import { AppContext } from "@/store";
import { colors } from "common/colors";
import React from "react";
import styled from "styled-components";

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
  const { state } = React.useContext(AppContext);
  return (
    <Outer backgroundColor={colors.greenDark}>
      <LoadingIndicator />
      <div>{state.installStatus ? state.installStatus : "Just a sec..."}</div>
    </Outer>
  );
};
