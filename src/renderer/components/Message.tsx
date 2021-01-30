import { OverridableComponent } from "@material-ui/core/OverridableComponent";
import { SvgIconTypeMap } from "@material-ui/core/SvgIcon";
import Typography from "@material-ui/core/Typography";
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

export interface MessageProps {
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  label?: string;
}

export const Message: React.FC<MessageProps> = ({ children, className, icon, label, style }) => {
  return (
    <Outer style={style} className={className}>
      {icon}
      {label && (
        <Typography variant="h6" style={{ marginTop: 20 }}>
          {label}
        </Typography>
      )}
      {children}
    </Outer>
  );
};

export interface IconMessageProps extends Omit<MessageProps, "icon"> {
  Icon: OverridableComponent<SvgIconTypeMap>;
}

export const IconMessage: React.FC<IconMessageProps> = (props) => {
  const { Icon, ...rest } = props;
  return (
    <Message
      icon={
        <span style={{ fontSize: 74 }}>
          <Icon fontSize="inherit" />
        </span>
      }
      {...rest}
    />
  );
};
