import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { SvgIconTypeMap } from "@material-ui/core/SvgIcon";
import Typography from "@material-ui/core/Typography";
import React from "react";

export const IconMessage: React.FC<{
  Icon: OverridableComponent<SvgIconTypeMap>;
  title: string;
}> = ({ Icon, title, children }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <span style={{ fontSize: 74 }}>
        <Icon fontSize="inherit" />
      </span>
      <Typography variant="h6" style={{ marginTop: 20 }}>
        {title}
      </Typography>
      {children}
    </div>
  );
};
