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
        const totalSeconds = Math.floor(remaining / 1_000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        setFormatted(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }
    };

    // Run immediately on mount/change to avoid a 1-second blank flash
    compute();

    const id = setInterval(compute, 1_000);

    return () => {
      clearInterval(id);
    };
  }, [expiresAt]); // Safely tracks the primitive number

  if (formatted === null) {
    return null;
  }

  return <>{formatted}</>;
});
