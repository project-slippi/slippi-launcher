import React from "react";

import { BouncingSlippiLogo } from "@/components/BouncingSlippiLogo";

import { Message } from "./Message";

export const LoadingScreen: React.FC<{
  className?: string;
  message?: string;
  style?: React.CSSProperties;
}> = ({ message, style, className }) => {
  return (
    <Message className={className} style={style} icon={<BouncingSlippiLogo />}>
      {message}
    </Message>
  );
};
