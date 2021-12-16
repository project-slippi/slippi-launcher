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

export const validateIpAndPort = (ip: string): string | boolean => {
  const ipPort = ip.split(":");
  let port = "";
  if (ipPort.length !== 2) {
    return "No Port provided or missing colon (:)";
  }
  [ip, port] = ipPort;

  if (parseInt(port) < 1 || parseInt(port) > 65535) {
    return "Invalid Port";
  }

  return isValidIpAddress(ip);
};

export const validateConnectCodeStart = (codeStart: string): string | true => {
  if (codeStart.length === 0) {
    return "Invalid code";
  }

  if (!/^[a-zA-Z]+$/.test(codeStart)) {
    return "Only English characters are allowed";
  }

  if (codeStart.length < 2) {
    return "Code is too short";
  }

  if (codeStart.length > 4) {
    return "Code is too long";
  }

  return true;
};

export const validateDisplayName = (displayName: string): string | true => {
  // these characters are confirmed to work in game
  if (!/^[ぁ-んァ-ン -[\]-_a-~]+$/u.test(displayName)) {
    return "Display names can only contain letters, numbers, Hiragana, Katakana, and special characters";
  }

  if (displayName.length === 0) {
    return "Display name is too short";
  }

  if (displayName.length > 15) {
    return "Display name is too long";
  }

  return true;
};
