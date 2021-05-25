/**
 * rewrite of Inifile.cpp/Inifile.h from dolphin in Typescript
 * https://github.com/dolphin-emu/dolphin/blob/master/Source/Core/Common/IniFile.cpp
 */

const fs = require("fs");
const readline = require("readline");

import { stripSpace } from "./utils";

export class IniFile {
  private sections: Section[];

  public constructor() {
    this.sections = [];
  }

  /** Differs from IniFile.cpp via:
   * Instead of editing keyOut and valueOut by reference, return them */
  public ParseLine = (line: string, valueOut: string): any => {
    if (line === "" || line[0] == "#") {
      return [null, null];
    }
    let retValueOut;
    let keyOut;
    const firstEquals = line.indexOf("=");
    if (firstEquals !== -1) {
      keyOut = line.substring(0, firstEquals).replace(/\s+/g, "");

      retValueOut = line
        .substring(firstEquals + 1)
        .replace(/\s+/g, "")
        .replace(/['"]+/g, "");
    }

    return [keyOut, retValueOut];
  };

  /**Differs from IniFile.cpp by:
   * returns section object, not pointer
   */
  public GetSection = (section_name: string): Section | undefined => {
    const section = this.sections.find((section) => section.name == section_name);
    return section;
  };

  /**Differs from IniFile.cpp by:
   * returns section object, not pointer
   */
  public GetOrCreateSection = (section_name: string): Section | undefined => {
    let section = this.GetSection(section_name);
    if (section === undefined) {
      section = new Section(section_name);
      this.sections.push(section);
    }
    return section;
  };

  public DeleteSection = (section_name: string): boolean => {
    const s = this.GetSection(section_name);
    if (s === undefined) {
      return false;
    }
    this.sections.splice(this.sections.indexOf(s), 1);
    return true;
  };

  public Exists = (section_name: string): boolean => {
    return this.GetSection(section_name) != undefined;
  };

  public SetLines = (section_name: string, lines: string[]): void => {
    const section = this.GetOrCreateSection(section_name);
    section?.SetLines(lines);
  };

  public DeleteKey = (section_name: string, key: string): boolean => {
    const section = this.GetSection(section_name);
    if (section === undefined) {
      return false;
    }
    return section.Delete(key);
  };

  /**Differs from IniFile.cpp by:
   * returns keys instead of passing it by reference
   */
  public GetKeys = (section_name: string): string[] | boolean => {
    const section = this.GetSection(section_name);
    if (section === undefined) {
      return false;
    }
    return section.keys_order;
  };

  /**Differs from IniFile.cpp by:
   * returns lines instead of passing it by reference
   */
  public GetLines = (section_name: string, remove_comments: boolean): string[] => {
    const section = this.GetSection(section_name);
    if (section === undefined) {
      return [];
    }

    const lines = section.GetLines(remove_comments);

    return lines;
  };

  public Load = async (fileName: string, keep_current_data: boolean): Promise<boolean> => {
    if (!keep_current_data) {
      this.sections = [];
    }

    const ins = fs.createReadStream(fileName);
    ins.on("error", (e) => {
      console.log("failed to read file with error", e);
      alert(e);
    });
    const rl = readline.createInterface({
      input: ins,
      terminal: false,
    });
    let current_section = undefined;
    let first_line = true;
    for await (let line of rl) {
      //console.log(line);
      // Skips the UTF-8 BOM at the start of files. Notepad likes to add this.
      if (first_line && line.substr(0, 3) == "\xEF\xBB\xBF") {
        line = line.slice(3);
      }
      first_line = false;

      //section line
      if (line[0] === "[") {
        //console.log(line, line[0]);
        const endpos = line.indexOf("]");
        if (endpos !== -1) {
          //we have a new section
          const sub = line.substr(1, endpos - 1);
          //console.log(sub);
          current_section = this.GetOrCreateSection(sub);
          //console.log(current_section);
        }
      } else {
        if (current_section !== undefined) {
          let value;
          const [key, value2] = this.ParseLine(line, value);

          // Lines starting with '$', '*' or '+' are kept verbatim.
          // Kind of a hack, but the support for raw lines inside an
          // INI is a hack anyway.
          if (
            (key == null && value == null) ||
            (line.length !== 0 && (line[0] == "$" || line[0] == "+" || line[0] == "*"))
          ) {
            current_section.m_lines.push(line);
          } else {
            current_section.Set(key, value2);
          }
        }
      }
    }

    return true;
  };

  public Save = (fileName: string): boolean => {
    const out = fs.createWriteStream(fileName);

    out.on("error", (e) => {
      console.log("failed to write file with error", e);
      alert(e);
    });

    this.sections.forEach((section) => {
      // originally section.name was only written if the section was non-empty, but I think
      // that goes against our use case
      out.write(`[${section.name}]\n`);

      if (section.keys_order.length == 0) {
        section.m_lines.forEach((line) => {
          out.write(`${line}\n`);
        });
        out.write("\n");
      } else {
        section.keys_order.forEach((kvit) => {
          const value = section.values.get(kvit);
          out.write(`${kvit}=${value}\n`);
        });
        out.write("\n");
      }
    });

    out.end();
    out.close();

    return true;
  };
}

export class Section {
  public name: string;
  public keys_order: string[];
  public m_lines: string[];
  public values: Map<string, string>;

  public constructor(_name: string) {
    this.name = _name;
    this.keys_order = [];
    this.m_lines = [];
    this.values = new Map();
  }

  /**Differs from IniFile.cpp by:
   * passes key by value rather than address
   */
  public Set = (key: string, new_value: string): void => {
    const newKey = !this.values.has(key);
    if (newKey) {
      this.keys_order.push(key);
    }
    this.values.set(key, new_value);
  };

  //TODO work around pass by reference
  public Get = (key: string, default_value: string): string | undefined => {
    const it = this.values.get(key);

    if (it !== undefined) {
      return it;
    }

    /**if (&default_value != &NULL_STRING)
    {
      *value = default_value;
      return true;
    }*/

    return undefined;
  };

  public Exists = (key: string): boolean => {
    return this.values.get(key) !== undefined;
  };

  public Delete = (key: string): boolean => {
    const success = this.values.delete(key);
    if (!success) {
      return false;
    }
    this.keys_order.splice(this.keys_order.indexOf(key), 1);
    return true;
  };

  public SetLines = (lines: string[]): void => {
    this.m_lines = lines;
  };

  /**Differs from IniFile.cpp by:
   * returns lines instead of passing it by reference
   */
  public GetLines = (remove_comments: boolean): string[] => {
    const lines: string[] = [];
    this.m_lines.forEach((line) => {
      let stripped_line = stripSpace(line);
      if (remove_comments) {
        const commentPos = line.indexOf("#");
        if (commentPos !== -1) {
          stripped_line = stripped_line.substring(0, commentPos);
        }
      }
      if (line !== "\n" && line !== "") {
        lines.push(line);
      }
    });
    return lines;
  };
}
