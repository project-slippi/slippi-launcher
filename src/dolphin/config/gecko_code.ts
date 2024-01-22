import type { IniFile } from "./ini_file";

export type GeckoCode = {
  name: string;
  creator: string | null;
  notes: string[];
  codeLines: string[];
  enabled: boolean;
  defaultEnabled: boolean;
  userDefined: boolean;
};

// this is very similar to LoadCodes in GeckoCodeConfig.cpp, but skips the address and data because we don't need them
export function loadGeckoCodes(globalIni: IniFile, localIni?: IniFile): GeckoCode[] {
  const gcodes: GeckoCode[] = [];
  [globalIni, localIni].forEach((ini) => {
    if (ini === undefined) {
      return;
    }
    const lines: string[] = ini.getLines("Gecko", false).filter((line) => {
      return line.length !== 0 || line[0] !== "#";
    });

    const parsedCodes = parseGeckoCodes(lines, { userDefined: ini === localIni });
    gcodes.push(...parsedCodes);

    //update enabled flags
    readEnabledAndDisabled(ini, gcodes);

    //set default enabled
    if (ini === globalIni) {
      gcodes.forEach((gcode) => {
        gcode.defaultEnabled = gcode.enabled;
      });
    }
  });
  return gcodes;
}

export function setCodes(iniFile: IniFile, codes: GeckoCode[]) {
  const lines: string[] = [];
  const enabledLines: string[] = [];
  const disabledLines: string[] = [];

  codes.forEach((code) => {
    if (code.enabled !== code.defaultEnabled) {
      (code.enabled ? enabledLines : disabledLines).push("$" + code.name);
    }
    makeGeckoCode(code, lines);
  });

  iniFile.setLines("Gecko", lines);
  iniFile.setLines("Gecko_Enabled", enabledLines);
  iniFile.setLines("Gecko_Disabled", disabledLines);
}

function readEnabledOrDisabled(iniFile: IniFile, section: string, enabled: boolean, codes: GeckoCode[]) {
  const lines = iniFile.getLines(section);

  lines.forEach((line) => {
    if (line.length === 0 || line[0] !== "$") {
      return;
    }

    const codeName = line.slice(1);

    codes.forEach((code) => {
      if (codeName.trim() === code.name.trim()) {
        code.enabled = enabled;
      }
    });
  });
}

function readEnabledAndDisabled(iniFile: IniFile, codes: GeckoCode[]) {
  readEnabledOrDisabled(iniFile, "Gecko_Enabled", true, codes);
  readEnabledOrDisabled(iniFile, "Gecko_Disabled", false, codes);
}

function makeGeckoCodeTitle(code: GeckoCode): string {
  const title = `$${code.name}`;
  if (code.creator !== null && code.creator.length > 0) {
    return `${title} [${code.creator}]`;
  }
  return title;
}

function makeGeckoCode(code: GeckoCode, lines: string[]) {
  if (!code.userDefined) {
    return;
  }

  lines.push(makeGeckoCodeTitle(code));
  code.notes.forEach((line) => lines.push(`*${line}`));
  code.codeLines.forEach((line) => lines.push(line));
}

export function parseGeckoCodes(input: string[], opts: { enabled?: boolean; userDefined?: boolean } = {}): GeckoCode[] {
  const lines = input;

  const parsedCodes: GeckoCode[] = [];
  let parsedCode: GeckoCode = {
    name: "",
    creator: "",
    notes: [],
    codeLines: [],
    enabled: Boolean(opts?.enabled),
    defaultEnabled: false,
    userDefined: Boolean(opts?.userDefined),
  };

  lines.forEach((line) => {
    switch (line[0]) {
      // code name
      case "$": {
        if (parsedCode.name.length > 0) {
          // if we already have a name then we hit a new code, so push the code and start parsing a new one
          parsedCodes.push(parsedCode);
        }
        const content = line.slice(1);
        const creatorMatch = content.match(/\[(.*?)\]/); // searches for brackets, catches anything inside them
        const creator = creatorMatch !== null ? creatorMatch[1] : creatorMatch;
        const name = creator ? content.split("[")[0] : content;

        parsedCode = {
          ...parsedCode,
          name: name.trim(),
          creator: creator,
          notes: [],
          codeLines: [],
        };
        break;
      }
      // comments
      case "*": {
        parsedCode.notes.push(line.slice(1).trim());
        break;
      }
      default: {
        parsedCode.codeLines.push(line);
        break;
      }
    }
  });

  if (parsedCode.name.length > 0) {
    parsedCodes.push(parsedCode);
  }

  return parsedCodes;
}

export function geckoCodeToString(geckoCode: GeckoCode): string {
  let output = `$${geckoCode.name.trim()}`;
  if (geckoCode.creator) {
    output += ` [${geckoCode.creator.trim()}]`;
  }
  output += "\n";
  if (geckoCode.notes.length) {
    geckoCode.notes.forEach((n) => (output += `*${n.trim()}\n`));
  }
  geckoCode.codeLines.forEach((c) => (output += `${c.trim()}\n`));
  output.trimEnd();

  return output;
}
