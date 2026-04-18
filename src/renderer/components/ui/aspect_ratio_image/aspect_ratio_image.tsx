import { forwardRef } from "react";

import styles from "./aspect_ratio_image.module.scss";

export interface AspectRatioImageProps {
  imageSrc: string;
}

export const AspectRatioImage = forwardRef<HTMLImageElement, AspectRatioImageProps>(({ imageSrc }, ref) => {
  return (
    <div className={styles.Root}>
      <img ref={ref} src={imageSrc} alt="" className={styles.BlurredLayer} aria-hidden="true" />
      <img src={imageSrc} alt="" className={styles.SharpLayer} />
    </div>
  );
});

AspectRatioImage.displayName = "AspectRatioImage";
