import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { clsx } from "clsx";
import React from "react";

import styles from "./code_block.module.scss";

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
    <div className={styles.container} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={clsx(styles.buttonContainer, isHovering && styles.visible)}>
        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
          <IconButton onClick={onCopy} size="small">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <code className={styles.code}>{content}</code>
    </div>
  );
});

const InlineCodeBlock = React.memo(function InlineCodeBlock({ content }: { content: string }) {
  return (
    <span className={styles.inlineContainer}>
      <code className={styles.code}>{content}</code>
    </span>
  );
});

export const CodeBlock = ({ content, inline = false }: { content: string; inline?: boolean }) => {
  if (inline) {
    return <InlineCodeBlock content={content} />;
  }
  return <StandaloneCodeBlock content={content} />;
};
