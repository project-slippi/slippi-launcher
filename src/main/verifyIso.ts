import { IsoValidity } from "@common/types";
import crypto from "crypto";
import fs from "fs";
import { fileExists } from "utils/fileExists";
interface IsoHashInfo {
  valid: IsoValidity;
  name: string;
}

const isoHashes = new Map<string, IsoHashInfo>();

// Valid ISOs
isoHashes.set("d4e70c064cc714ba8400a849cf299dbd1aa326fc", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02",
});
isoHashes.set("6e83240872d47cd080a28dea7b8907140c44bef5", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02 NKIT",
});
isoHashes.set("3bf23f7c87caadfc983954eb8c6cf2823fa8713b", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02 GCZ",
});
isoHashes.set("e63d50e63a0cdd357f867342d542e7cec0c3a7c7", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02 Scrubbed #1",
});
isoHashes.set("55109bc139b947c8b96b5fc913fbd91245104db8", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02 Scrubbed #2",
});
isoHashes.set("2ce0ccfc8c31eafe2ff354fe03ac2dd94c20b937", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02 Scrubbed #3",
});
isoHashes.set("49a04772e0a5d1974a4b1c8a7c0d1d71184f3978", {
  valid: IsoValidity.VALID,
  name: "NTSC-U 1.02 Scrubbed #4",
});
isoHashes.set("71255a30a47b4c6aabb90308d7a514d09d93a7b5", {
  valid: IsoValidity.VALID,
  name: "NTSC-J 1.02",
});
isoHashes.set("e9ab27b4f8fdfb72adae214f834e201d14944f50", {
  valid: IsoValidity.VALID,
  name: "NTSC-J 1.02 GCZ",
});

// Invalid ISOs
isoHashes.set("2f0bed5e1d92ebb187840c6e1a2f368ce35f6816", {
  valid: IsoValidity.INVALID,
  name: "20XX 3.02",
});
isoHashes.set("7f6926f2f35940f5f697eb449c9f3fbd3639dd45", {
  valid: IsoValidity.INVALID,
  name: "20XX 4.07++",
});
isoHashes.set("49fd53b0a5eb0da9215846cd653ccc4c3548ec69", {
  valid: IsoValidity.INVALID,
  name: "20XX 4.07++ UCF",
});
isoHashes.set("4521c1753b0c9d5c747264fce63e84b832bd80a1", {
  valid: IsoValidity.INVALID,
  name: "Training Mode v1.1",
});
isoHashes.set("c89cb9b694f0f26ee07a6ee0a3633ba579e5fa12", {
  valid: IsoValidity.INVALID,
  name: "NTSC-U 1.00 Scrubbed # 1",
});
isoHashes.set("5ab1553a941307bb949020fd582b68aabebecb30", {
  valid: IsoValidity.INVALID,
  name: "NTSC-U 1.00",
});
isoHashes.set("5ecab83cd72c0ff515d750280f92713f19fa46f1", {
  valid: IsoValidity.INVALID,
  name: "NTSC-U 1.01",
});
isoHashes.set("d0a925866379c546ceb739eeb780d011383cb07c", {
  valid: IsoValidity.INVALID,
  name: "PAL",
});
isoHashes.set("fe23c91b63b0731ef727c13253b6a8c6757432ac", {
  valid: IsoValidity.INVALID,
  name: "NTSC-J 1.00",
});
isoHashes.set("f7ff7664b231042f2c0802041736fb9396a94b83", {
  valid: IsoValidity.INVALID,
  name: "NTSC-J 1.01",
});
isoHashes.set("c7c0866fbe6d7ebf3b9c4236f4f32f4c8f65b578", {
  valid: IsoValidity.INVALID,
  name: "Taikenban (demo)",
});

export async function verifyIso(isoPath: string): Promise<IsoValidity> {
  const exists = await fileExists(isoPath);
  if (!exists) {
    return Promise.reject(`Error verifying ISO: File ${isoPath} does not exist`);
  }

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const input = fs.createReadStream(isoPath);
    let checkedRevision = false;

    input.on("error", (err) => {
      reject(`Error reading ISO file ${isoPath}: ${err}`);
    });

    input.on("readable", () => {
      const data: Buffer = input.read();
      if (data) {
        if (!checkedRevision && !isoPath.endsWith(".gcz")) {
          checkedRevision = true;
          const revision = data.readInt8(7);
          if (revision !== 2) {
            resolve(IsoValidity.INVALID);
            return;
          }
        }

        hash.update(data);
        return;
      }

      // Reading complete, check hash
      const resultHash = hash.digest("hex");
      const isoInfo = isoHashes.get(resultHash);
      if (isoInfo) {
        resolve(isoInfo.valid);
      } else {
        resolve(IsoValidity.UNKNOWN);
      }
    });
  });
}
