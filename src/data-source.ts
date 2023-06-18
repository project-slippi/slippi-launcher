import { DataSource } from "typeorm";

const dataSources: { [id: string]: DataSource } = {};

async function getDataSource(dbName: string) {
  if (dbName in dataSources) {
    return dataSources[dbName];
  }

  const AppDataSource = new DataSource({
    type: "sqlite",
    //database: settingsManager.get().settings.rootSlpPath + "/index.sqlite3",
    //database: "/home/agiera/Slippi/index.sqlite3",
    database: dbName,
    synchronize: true,
    logging: true,
    entities: ["src/entity/*.ts"],
  });

  AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });

  dataSources[dbName] = AppDataSource;

  return AppDataSource;
}

export default getDataSource;
