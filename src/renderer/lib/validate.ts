export const isValidIpAddress = (ip: string) => {
  if (ip === "localhost") {
    return true;
  }

  const chunks = ip.split(".");
  if (chunks.length !== 4) {
    return false;
  }

  return chunks.map((n) => parseInt(n)).every((n) => n >= 0 && n <= 255);
};

export const isValidIpAndPort = (ip: string) => {
  const ipPort = ip.split(":");
  let port = "";
  if (ipPort.length !== 2) {
    return "No Port provided or missing colon (:)";
  }
  [ip, port] = ipPort;

  if (parseInt(port) <= 1 || parseInt(port) >= 65535) {
    return "Invalid Port";
  }

  return isValidIpAddress(ip);
};
