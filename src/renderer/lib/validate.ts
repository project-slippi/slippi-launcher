import { isIP } from "net";

export const isValidIpv4Address = (ip: string): boolean => {
  return ip === "localhost" || isIP(ip) === 4;
};

const isValidIpv6Address = (ip: string): boolean => {
  return isIP(ip) === 6;
};

export const validateIpAndPort = (ipAddressWithPort: string): string | true => {
  // ipv6 addrs are surrounded by brackets when including ports
  // ipv4 will cover the localhost case since it matches syntactically
  const ipv6Port = ipAddressWithPort.split("]:");
  ipv6Port[0] = ipv6Port[0].replace("[", "");
  const ipv4Port = ipAddressWithPort.split(":");
  const ipPort = ipv6Port.length !== 2 ? ipv4Port : ipv6Port;

  if (ipPort.length !== 2) {
    return "No Port provided or missing colon (:)";
  }
  const [ip, port] = ipPort;

  if (parseInt(port) < 1 || parseInt(port) > 65535) {
    return "Invalid Port";
  }

  if (!isValidIpv4Address(ip) || !isValidIpv6Address(ip)) {
    return "Invalid IP address";
  }

  return true;
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
