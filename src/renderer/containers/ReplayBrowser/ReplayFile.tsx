import React from "react";
import { FileResult } from "common/replayBrowser";

export const ReplayFile: React.FC<FileResult> = (props) => {
  return <div>{props.fullPath}</div>;
};
