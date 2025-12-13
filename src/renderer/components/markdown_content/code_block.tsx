import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import stylex from "@stylexjs/stylex";
import React from "react";

const styles = stylex.create({
  inlineContainer: {
    padding: "2px 6px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    position: "relative",
  },
  container: {
    fontSize: 15,
    padding: "20px 30px",
    paddingRight: "50px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    position: "relative",
  },
  code: {
    color: "#999",
    lineHeight: "1.5em",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
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

const StandaloneCodeBlock = React.memo(function StandaloneCodeBlock({ content }: { content: string }) {
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

const InlineCodeBlock = React.memo(function InlineCodeBlock({ content }: { content: string }) {
  return (
    <span {...stylex.props(styles.inlineContainer)}>
      <code {...stylex.props(styles.code)}>{content}</code>
    </span>
  );
});

export const CodeBlock = ({ content, inline = false }: { content: string; inline?: boolean }) => {
  if (inline) {
    return <InlineCodeBlock content={content} />;
  }
  return <StandaloneCodeBlock content={content} />;
};
