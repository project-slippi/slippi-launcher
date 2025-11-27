## Database Usage

The Slippi Launcher uses an SQLite database to store replay information. It uses the implementation `better-sqlite3` and the query builder `kysely`, which gives us type safety and also automatically handles migrations for us.

### Making Schema Changes

#### 0. Prerequisites

Read through the [Kysely docs](https://kysely.dev/docs/getting-started).


#### 1. Modify `schema.ts`

Make any changes you need to the `src/database/schema.ts` file, such as defining new tables, or columns.

#### 2. Create a new migration file

Using the ISO timestamp format, create a new file in the `src/database/migrations` folder. Migrations are run in alphabetical order so it's imperative to follow the naming convention: `YYYYMMDDTHHMM_some_description.ts` to ensure the migrations are applied correctly. For example: `20231103T1139_add_foo_column.ts`

#### 3. Write the migration code

The SQL commands that need to be run should be defined in the `up()` function, and the reverse or tear-down of the migration should be defined in the `down()` function. 
See [this example](https://kysely.dev/docs/migrations) in the docs on how to write the migrations.

#### 4. (OPTIONAL) Force re-index

**This is destructive! Only do this if you want to re-create the database from scratch!**

In `src/database/create_database.ts` you can increment the `DATABASE_USER_VERSION`. This will cause the user's database to be completely cleared and re-indexed from scratch. Only do this if there are major breaking changes to the schema, or new logic/computations that must be run to take advantage of the new changes.


### Development Practices

By default, in develop mode, it uses an in-memory database. This means no physical SQLite file is being used or migrated, and it will always be up to date. This is useful for testing that your migration code works, but it's still best to write tests in the `src/database/tests` folder to ensure expected the behaviour.

If you want to test the migrations with an actual file, you can either package the application, or force it to not use the in-memory database in the code.

During development, you can continue to make changes to your migration file (created in step 3), though you might encounter migration issues if you've been testing it with a real database file. **Do NOT modify previous migration files that have already been released!**


### Migration Packaging and Execution

The schema migrations are compiled and included in the package itself so they can be ran on the user's machine. The `npm run package` command already does all this for you, so you don't need to do anything else. The packaging process it uses is as follows:

1. Compile from TS into JS with the command `npm run build:migrations`. These get built into the `release/app/dist/migrations` folder.
2. Copy  `release/app/dist/migrations/*.js` files into the [extraResources](https://www.electron.build/configuration/contents.html#extraresources) folder, see `electron-builder.json`
3. When the packaged app is ran, it will execute the migrations in the `extraResources/migrations` folder when the app is initialized. See `src/database/create_database.ts` for this implementation.
