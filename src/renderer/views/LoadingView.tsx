import { LoadingIndicator } from "@/components/LoadingIndicator";
import { AppContext } from "@/store";
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
  const { state } = React.useContext(AppContext);
  return (
    <Outer>
      <LoadingIndicator />
      <div>Loading...</div>
      {state.installStatus && <div>{state.installStatus}</div>}
    </Outer>
  );
};
