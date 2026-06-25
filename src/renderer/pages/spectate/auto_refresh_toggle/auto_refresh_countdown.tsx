import React from "react";

type AutoRefreshCountdownProps = {
  expiresAt: number | null; // Unix epoch timestamp in milliseconds
};

export const AutoRefreshCountdown = React.memo(({ expiresAt }: AutoRefreshCountdownProps) => {
  const [formatted, setFormatted] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (expiresAt === null) {
      setFormatted(null);
      return;
    }

    const compute = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setFormatted(null);
      } else {
        setFormatted(formatTimeRemaining(remaining));
      }
    };

    compute();

    const id = setInterval(compute, 1_000);
    return () => {
      clearInterval(id);
    };
  }, [expiresAt]);

  if (formatted === null) {
    return null;
  }

  return <>{formatted}</>;
});

function formatTimeRemaining(remainingMs: number): string {
  const totalSeconds = Math.floor(remainingMs / 1_000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
