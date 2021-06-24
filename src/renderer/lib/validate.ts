export const isValidIpAddress = (ip: string): boolean => {
  if (ip === "localhost") {
    return true;
  }

  const chunks = ip.split(".");
  if (chunks.length !== 4) {
    return false;
  }

  return chunks.map((n) => parseInt(n)).every((n) => n >= 0 && n <= 255);
};
