import React from "react";
import Typography from "@material-ui/core/Typography";

export interface SettingItemProps {
  name: string;
  description?: string;
}

export const SettingItem: React.FC<SettingItemProps> = (props) => {
  return (
    <div style={{ margin: "20px 0" }}>
      <Typography variant="subtitle1">{props.name}</Typography>
      {props.description && (
        <div style={{ paddingBottom: 5, opacity: 0.6 }}>
          <Typography variant="caption">{props.description}</Typography>
        </div>
      )}
      {props.children}
    </div>
  );
};
