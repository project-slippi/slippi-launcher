import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { clsx } from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { ExternalLink } from "@/components/external_link";
import { Button } from "@/components/form/button";

import { CarouselMessages as Messages } from "./carousel.messages";
import styles from "./carousel.module.scss";

const TRANSITION_DURATION_MS = 400;

export interface CarouselItem {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isHappeningNow?: boolean;
  streamUrl?: string;
  countdown?: string;
}

export interface CarouselProps {
  items: CarouselItem[];
  durationMs?: number;
}

export const Carousel = React.memo(function Carousel({ items, durationMs = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const isAnimatingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const extendedItems = [items[items.length - 1], ...items, items[0]];
  const realItemsLength = items.length;
  const isAtEnd = currentIndex === extendedItems.length - 1;
  const isAtStart = currentIndex === 0;

  const handleTransitionEnd = useCallback(() => {
    isAnimatingRef.current = false;

    if (isAtEnd) {
      setTransitionEnabled(false);
      setCurrentIndex(1);
    } else if (isAtStart) {
      setTransitionEnabled(false);
      setCurrentIndex(extendedItems.length - 2);
    }
  }, [isAtEnd, isAtStart, extendedItems.length]);

  const goToNext = useCallback(() => {
    if (isAnimatingRef.current || realItemsLength <= 1) {
      return;
    }
    isAnimatingRef.current = true;
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev + 1);
  }, [realItemsLength]);

  const goToPrevious = useCallback(() => {
    if (isAnimatingRef.current || realItemsLength <= 1) {
      return;
    }
    isAnimatingRef.current = true;
    setTransitionEnabled(true);
    setCurrentIndex((prev) => prev - 1);
  }, [realItemsLength]);

  const goToIndex = useCallback(
    (index: number) => {
      if (isAnimatingRef.current || realItemsLength <= 1) {
        return;
      }
      isAnimatingRef.current = true;
      setTransitionEnabled(true);
      setCurrentIndex(index + 1);
    },
    [realItemsLength],
  );

  useEffect(() => {
    if (isHovered || realItemsLength <= 1) {
      return;
    }

    const timer = setInterval(goToNext, durationMs);
    return () => clearInterval(timer);
  }, [isHovered, realItemsLength, durationMs, goToNext]);

  useEffect(() => {
    if (!transitionEnabled) {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    }
  }, [transitionEnabled]);

  if (realItemsLength === 0) {
    return null;
  }

  return (
    <div className={styles.container} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className={styles.slidesContainer}>
        <div
          ref={trackRef}
          className={styles.slidesTrack}
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: transitionEnabled ? `transform ${TRANSITION_DURATION_MS}ms ease-in-out` : "none",
          }}
        >
          {extendedItems.map((item, index) => {
            return (
              <div key={index} className={styles.slide}>
                <div className={styles.card}>
                  <div className={styles.imageContainer}>
                    <img src={item.image} style={{ objectFit: "cover", width: "100%", height: "100%" }} />;
                  </div>
                  <div className={styles.info}>
                    <ExternalLink href={item.link} className={styles.link}>
                      <h2 className={styles.title}>{item.title}</h2>
                    </ExternalLink>
                    <div className={styles.subtitle}>{item.subtitle}</div>
                  </div>
                  <div className={styles.happeningNowContainer}>
                    <div>
                      {item.isHappeningNow ? (
                        <div className={clsx(styles.countdownBadge, styles.happeningNowBadge)}>
                          {Messages.inProgress()}
                        </div>
                      ) : (
                        item.countdown && <div className={styles.countdownBadge}>{item.countdown}</div>
                      )}
                    </div>
                    {item.isHappeningNow && item.streamUrl && (
                      <Button
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        style={{ fontSize: 14 }}
                        onClick={() => window.electron.shell.openExternal(item.streamUrl!)}
                      >
                        {Messages.viewStream()}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.indicators}>
        {items.map((_, index) => (
          <button
            key={index}
            className={clsx(styles.indicator, index === currentIndex - 1 && styles.indicatorActive)}
            onClick={() => goToIndex(index)}
          />
        ))}
      </div>

      {realItemsLength > 1 && (
        <div className={styles.navContainer}>
          <button className={clsx(styles.arrowButton, styles.arrowLeft)} onClick={goToPrevious}>
            <ChevronLeftIcon />
          </button>
          <button className={clsx(styles.arrowButton, styles.arrowRight)} onClick={goToNext}>
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  );
});
