import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";
import React from "react";
import styled from "styled-components";

const Outer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const LoadingScreen: React.FC<{
  message?: string;
  style?: React.CSSProperties;
}> = ({ message, style }) => {
  return (
    <Outer style={style}>
      <BouncingSlippiLogo />
      <div>{message}</div>
    </Outer>
  );
};
