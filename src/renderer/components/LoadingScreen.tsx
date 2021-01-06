import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";
import React from "react";
import { Message } from "./Message";

export const LoadingScreen: React.FC<{
  message?: string;
  style?: React.CSSProperties;
}> = ({ message, style }) => {
  return (
    <Message style={style} icon={<BouncingSlippiLogo />}>
      {message}
    </Message>
  );
};
