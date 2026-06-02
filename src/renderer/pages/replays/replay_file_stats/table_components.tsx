import React from "react";

import styles from "./table.module.css";

export const Table = ({ children }: { children: React.ReactNode }) => {
  return <table className={styles.table}>{children}</table>;
};

export const TableHeaderCell = (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => {
  return <td className={styles.tableHeaderCell} {...props} />;
};

export const TableSubHeaderCell = (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => {
  return <td className={styles.tableSubHeaderCell} {...props} />;
};

type TableCellProps = React.TdHTMLAttributes<HTMLTableDataCellElement> & {
  highlight?: boolean;
};

export const TableCell = ({ highlight, className, ...props }: TableCellProps) => {
  const cls = [styles.tableCell, highlight ? styles.tableCellHighlight : "", className ?? ""].filter(Boolean).join(" ");
  return <td className={cls} {...props} />;
};

export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => {
  return <tr className={styles.tableRow} {...props} />;
};

type GrayableImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  gray?: boolean;
};

export const GrayableImage = ({ gray, className, ...props }: GrayableImageProps) => {
  const cls = [styles.grayableImageGray, className ?? ""].filter(Boolean).join(" ");
  return <img className={gray ? cls : undefined} {...props} />;
};
