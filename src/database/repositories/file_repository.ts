import type { Kysely } from "kysely";

import type { Database, FileRecord, NewFile } from "../schema";

type DB = Kysely<Database>;

export class FileRepository {
  public static async insertFile(db: DB, file: NewFile) {
    return db.insertInto("file").values(file).returningAll().executeTakeFirstOrThrow();
  }

  public static async findAllFilesInFolder(db: DB, folder: string): Promise<Pick<FileRecord, "_id" | "name">[]> {
    const query = db.selectFrom("file").where("folder", "=", folder);
    const records = await query.select(["_id", "name"]).execute();
    return records;
  }

  public static async deleteFileById(db: DB, ...ids: number[]) {
    return await db.deleteFrom("file").where("_id", "in", ids).execute();
  }

  public static async findTotalSizeByFolder(db: DB, folder: string): Promise<number> {
    const query = db
      .selectFrom("file")
      .where("folder", "=", folder)
      .select((eb) => eb.fn.sum<number>("file.size_bytes").as("total_size"));
    const res = await query.executeTakeFirst();
    return res?.total_size ?? 0;
  }
}
