import { clsx } from "clsx";

import styles from "./content_block.module.css";

export const ContentBlock = ({
  title,
  content,
  onClick,
  fill,
  endIcon,
  overflowY = "auto",
}: {
  fill?: boolean;
  title?: string;
  content: React.ReactNode;
  onClick?: () => void;
  endIcon?: React.ReactNode;
  overflowY?: "auto" | "hidden";
}) => {
  return (
    <div className={clsx(styles.outer, { [styles.fill]: fill })}>
      {title && (
        <div className={clsx(styles.header, onClick && styles.active)} onClick={onClick}>
          <h3 className={styles.title}>{title}</h3>
          {endIcon}
        </div>
      )}
      <div className={styles.content} style={{ overflowY }}>
        {content}
      </div>
    </div>
  );
};
