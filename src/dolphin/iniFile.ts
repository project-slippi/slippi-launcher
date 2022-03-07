/**
 * rewrite of Inifile.cpp/Inifile.h from dolphin in Typescript
 * https://github.com/dolphin-emu/dolphin/blob/master/Source/Core/Common/IniFile.cpp
 */

import electronLog from "electron-log";
import fs from "fs";
import { ensureFileSync } from "fs-extra";
import readline from "readline";

const log = electronLog.scope("iniFile");

/**
 * The IniFile Class, contains a Section subclass
 */
export class IniFile {
  private sections: Section[];

  public constructor() {
    this.sections = [];
  }

  /** Differs from IniFile.cpp via:
   * Instead of editing keyOut and valueOut by reference, return them */
  private parseLine(line: string): readonly [string, string] | readonly [null, null] {
    let retValueOut = "";
    let keyOut = "";

    if (line === "" || line[0] === "#" || !line.includes("=")) {
      return [null, null] as const;
    }

    const firstEquals = line.indexOf("=");
    if (firstEquals !== -1) {
      keyOut = line.substring(0, firstEquals).trim();
      retValueOut = line
        .substring(firstEquals + 1)
        .trim()
        .replace(/(^"|"$)/g, ""); // remove quotes at the start or end of the string but not inside
    }

    return [keyOut, retValueOut] as const;
  }

  /**Differs from IniFile.cpp by:
   * returns section object, not pointer
   */
  public getSection(sectionName: string): Section | undefined {
    const section = this.sections.find((section) => section.name === sectionName);
    return section;
  }

  /**Differs from IniFile.cpp by:
   * returns section object, not pointer
   */
  public getOrCreateSection(sectionName: string): Section {
    let section = this.getSection(sectionName);
    if (section === undefined) {
      section = new Section(sectionName);
      this.sections.push(section);
    }
    return section;
  }

  public deleteSection(sectionName: string): boolean {
    const s = this.getSection(sectionName);
    if (s === undefined) {
      return false;
    }
    this.sections.splice(this.sections.indexOf(s), 1);
    return true;
  }

  public exists(sectionName: string): boolean {
    return this.getSection(sectionName) != undefined;
  }

  public setLines(sectionName: string, lines: string[]): void {
    const section = this.getOrCreateSection(sectionName);
    section.setLines(lines);
  }

  public deleteKey(sectionName: string, key: string): boolean {
    const section = this.getSection(sectionName);
    if (section === undefined) {
      return false;
    }
    return section.delete(key);
  }

  /**Differs from IniFile.cpp by:
   * returns keys instead of passing it by reference
   */
  public getKeys(sectionName: string): string[] {
    const section = this.getSection(sectionName);
    if (section === undefined) {
      return [];
    }
    return section.keysOrder;
  }

  /**Differs from IniFile.cpp by:
   * returns lines instead of passing it by reference
   */
  public getLines(sectionName: string, removeComments = false): string[] {
    const section = this.getSection(sectionName);
    if (section === undefined) {
      return [];
    }

    const lines = section.getLines(removeComments);

    return lines;
  }

  public async load(fileName: string, keepCurrentData = true): Promise<boolean> {
    if (!keepCurrentData) {
      this.sections = [];
    }

    const ins = fs.createReadStream(fileName);
    ins.on("error", (e) => {
      log.error("failed to read file with error", e);
    });
    const rl = readline.createInterface({
      input: ins,
      terminal: false,
    });
    let currentSection = undefined;
    let firstLine = true;
    for await (let line of rl) {
      // Skips the UTF-8 BOM at the start of files. Notepad likes to add this.
      if (firstLine && line.substr(0, 3) === "\xEF\xBB\xBF") {
        line = line.slice(3);
      }
      firstLine = false;

      //section line
      if (line[0] === "[") {
        const endpos = line.indexOf("]");
        if (endpos !== -1) {
          //we have a new section
          const sub = line.substr(1, endpos - 1);
          currentSection = this.getOrCreateSection(sub);
        }
      } else {
        if (currentSection !== undefined) {
          const [key, value] = this.parseLine(line);

          // Lines starting with '$', '*' or '+' are kept verbatim.
          // Kind of a hack, but the support for raw lines inside an
          // INI is a hack anyway.
          if (
            (key === null && value === null) ||
            (line.length !== 0 && ["$", "+", "*"].some((val) => line[0] === val))
          ) {
            currentSection.lines.push(line);
          } else if (key !== null && value !== null) {
            currentSection.set(key, value);
          }
        }
      }
    }

    return true;
  }

  public save(filePath: string): boolean {
    ensureFileSync(filePath);
    const out = fs.createWriteStream(filePath);

    out.on("error", (e) => {
      log.error("failed to write file with error", e);
    });

    this.sections.forEach((section) => {
      // originally section.name was only written if the section was non-empty,
      // but that goes against us wanting to always show the Gecko section
      out.write(`[${section.name}]\n`);

      if (section.keysOrder.length === 0) {
        section.lines.forEach((line) => {
          out.write(`${line}\n`);
        });
        out.write("\n");
      } else {
        section.keysOrder.forEach((kvit) => {
          const value = section.values.get(kvit);
          out.write(`${kvit} = ${value}\n`);
        });
      }
    });

    out.end();
    out.close();

    return true;
  }
}

/**
 * The Section class
 */
export class Section {
  public name: string;
  public keysOrder: string[];
  public lines: string[];
  public values: Map<string, string>;

  public constructor(name: string) {
    this.name = name;
    this.keysOrder = [];
    this.lines = [];
    this.values = new Map();
  }

  /**Differs from IniFile.cpp by:
   * passes key by value rather than address
   */
  public set(key: string, newValue: string): void {
    const newKey = !this.values.has(key);
    if (newKey) {
      this.keysOrder.push(key);
    }
    this.values.set(key, newValue);
  }

  //TODO work around pass by reference
  // no idea what default value is for
  public get(key: string, defaultValue: string): string {
    const value = this.values.get(key);

    if (value !== undefined) {
      return value;
    }

    return defaultValue;
  }

  public exists(key: string): boolean {
    return this.values.get(key) !== undefined;
  }

  public delete(key: string): boolean {
    const success = this.values.delete(key);
    if (success) {
      this.keysOrder.splice(this.keysOrder.indexOf(key), 1);
    }

    return success;
  }

  public setLines(lines: string[]): void {
    this.lines = lines;
  }

  /**Differs from IniFile.cpp by:
   * returns lines instead of passing it by reference
   */
  public getLines(removeComments: boolean): string[] {
    const lines: string[] = [];
    this.lines.forEach((l) => {
      let line = l.trim();
      if (removeComments) {
        const commentPos = line.indexOf("#");
        if (commentPos === 0) {
          return;
        }
        if (commentPos !== -1) {
          line = line.substring(0, commentPos);
        }
      }
      if (line !== "\n" && line !== "") {
        lines.push(line);
      }
    });
    return lines;
  }
}
