import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { clsx } from "clsx";

import styles from "./content_block.module.css";

export const ContentBlock = ({
  title,
  content,
  onClick,
  fill,
}: {
  fill?: boolean;
  title: string;
  content: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div className={clsx(styles.outer, { [styles.fill]: fill })}>
      <div className={clsx(styles.header, onClick && styles.active)} onClick={onClick}>
        <h3 className={styles.title}>{title}</h3>
        {onClick && <ChevronRightIcon />}
      </div>
      <div className={styles.content}>{content}</div>
    </div>
  );
};
