import { forwardRef } from "react";

import styles from "./aspect_ratio_image.module.scss";

type AspectRatioImageProps = {
  src: string;
  alt?: string;
};

export const AspectRatioImage = forwardRef<HTMLImageElement, AspectRatioImageProps>(({ src, alt }, ref) => {
  return (
    <div className={styles.Root}>
      <img ref={ref} src={src} alt={alt} className={styles.BlurredLayer} aria-hidden="true" />
      <img src={src} alt={alt} className={styles.SharpLayer} />
    </div>
  );
});
