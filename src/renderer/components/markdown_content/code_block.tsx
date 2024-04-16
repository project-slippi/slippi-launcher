import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import stylex from "@stylexjs/stylex";
import React from "react";

const styles = stylex.create({
  container: {
    fontSize: 15,
    padding: "20px 30px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    position: "relative",
  },
  code: {
    color: "#999",
    lineHeight: "1.5em",
  },
  buttonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    opacity: 0,
    transition: "opacity 0.1s ease-in-out",
  },
  visible: {
    opacity: 1,
  },
});

export const CodeBlock = React.memo(function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = React.useState<boolean>(false);
  const [isHovering, setIsHovering] = React.useState<boolean>(false);
  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);
  const onCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(console.error);
  };
  return (
    <div {...stylex.props(styles.container)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div {...stylex.props(styles.buttonContainer, isHovering && styles.visible)}>
        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
          <IconButton onClick={onCopy} size="small">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <code {...stylex.props(styles.code)}>{content}</code>
    </div>
  );
});
