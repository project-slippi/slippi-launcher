import React from "react";

import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";

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
