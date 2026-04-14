import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { clsx } from "clsx";

import styles from "./content_block.module.scss";

export const ContentBlock = ({
  title,
  content,
  onClick,
}: {
  title: string;
  content: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div className={styles.Outer}>
      <div className={clsx(styles.Header, onClick && styles.active)} onClick={onClick}>
        <h3 className={styles.Title}>{title}</h3>
        {onClick && <ChevronRightIcon />}
      </div>
      <div className={styles.Content}>{content}</div>
    </div>
  );
};
