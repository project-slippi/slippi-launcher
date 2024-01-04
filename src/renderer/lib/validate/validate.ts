import { isIPv4, isIPv6 } from "is-ip";

export const isValidIpv4Address = (ip: string): boolean => {
  return ip === "localhost" || isIPv4(ip);
};

export const isValidIpv6Address = (ip: string): boolean => {
  return isIPv6(ip);
};

export const isValidIpAddress = (ip: string): string | true => {
  if (!isValidIpv4Address(ip) && !isValidIpv6Address(ip)) {
    return "Invalid IP address";
  }

  return true;
};

export function isValidPort(value: string | number) {
  const port = typeof value === "string" ? parseInt(value) : value;
  return port > 0 && port < 65535;
}

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
  if (!/^((?![\\`])[ぁ-んァ-ン -~])+$/u.test(displayName)) {
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
