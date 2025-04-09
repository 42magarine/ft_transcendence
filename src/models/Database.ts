import Database from "better-sqlite3";
import type { Database as DBType } from "better-sqlite3";

export const db: DBType = new Database("/app/models/db/userDB.db", { verbose: console.log });

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE
    );
`);
