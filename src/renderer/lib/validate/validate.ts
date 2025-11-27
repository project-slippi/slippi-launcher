import { isIPv4, isIPv6 } from "is-ip";

import { ValidateMessages as Messages } from "./validate.messages";

export const isValidIpv4Address = (ip: string): boolean => {
  return ip === "localhost" || isIPv4(ip);
};

export const isValidIpv6Address = (ip: string): boolean => {
  return isIPv6(ip);
};

export const isValidIpAddress = (ip: string): string | true => {
  if (!isValidIpv4Address(ip) && !isValidIpv6Address(ip)) {
    return Messages.invalidIpAddress();
  }

  return true;
};

export function isValidPort(value: string | number) {
  const port = typeof value === "string" ? parseInt(value) : value;
  return port > 0 && port < 65535;
}

export const validateConnectCodeStart = (codeStart: string): string | true => {
  if (codeStart.length === 0) {
    return Messages.invalidCode();
  }

  if (!/^[a-zA-Z]+$/.test(codeStart)) {
    return Messages.onlyEnglishCharactersAllowed();
  }

  if (codeStart.length < 2) {
    return Messages.codeIsTooShort();
  }

  if (codeStart.length > 4) {
    return Messages.codeIsTooLong();
  }

  return true;
};

export const validateDisplayName = (displayName: string): string | true => {
  // these characters are confirmed to work in game
  if (!/^((?![\\`])[ぁ-んァ-ン -~])+$/u.test(displayName)) {
    return Messages.displayNamesCanOnlyContain();
  }

  if (displayName.length === 0) {
    return Messages.displayNameIsTooShort();
  }

  if (displayName.length > 15) {
    return Messages.displayNameIsTooLong();
  }

  return true;
};
